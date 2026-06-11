import { v } from "convex/values"
import { internal } from "./_generated/api"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import { resolveProfile } from "./lib/adminAuth"
import { assertEntitled } from "./lib/entitlements"
import { enqueueNotification } from "./lib/notify"
import { authorizeRelease, autoResolveDeathCase } from "./release"

// The dead-man's-switch state machine. ZERO crypto here — just timestamps + a
// server-evaluated state. Release (pendingVerification → released) is intentionally
// NOT implemented yet; it needs beneficiaries / attestations / death-verification.
//
// Key invariant: `nextDeadlineAt` is the timestamp of the NEXT state transition,
// not only the check-in deadline. In "active" it's lastCheckInAt + interval; on
// entry to "grace" it becomes now + gracePeriodMs. So one index
// (by_state_and_nextDeadlineAt) + one cron drive both sweeps.

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_INTERVAL_MS = 30 * DAY_MS
const DEFAULT_GRACE_MS = 14 * DAY_MS
const SWEEP_BATCH = 100

async function loadSwitch(ctx: QueryCtx, ownerId: string) {
  return await ctx.db
    .query("switchState")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique()
}

async function logStateChange(
  ctx: MutationCtx,
  ownerId: string,
  actor: string,
  from: string | null,
  to: string
) {
  await ctx.db.insert("auditLog", {
    ownerId,
    actor,
    event: "switch_state_changed",
    targetTable: "switchState",
    meta: { from: from ?? "none", to },
  })
}

/** Record a heartbeat in the audit feed. The `checkIns` table is the operational
 *  record; this is the human-readable activity entry the owner sees on home. */
async function logCheckIn(ctx: MutationCtx, ownerId: string) {
  await ctx.db.insert("auditLog", {
    ownerId,
    actor: ownerId,
    event: "check_in",
    targetTable: "switchState",
  })
}

/**
 * The current user's switch state, or null when not yet armed (the client treats
 * that as "arm on first check-in"). Returns the RAW `nextDeadlineAt` — never a
 * computed daysLeft/isInGrace: a query that reads wall-clock would be a reactive-
 * cache hazard and freeze. The client derives the countdown from this timestamp.
 */
export const getSwitchState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const row = await loadSwitch(ctx, identity.tokenIdentifier)
    if (row === null) {
      return null
    }
    return {
      state: row.state,
      checkInIntervalMs: row.checkInIntervalMs,
      gracePeriodMs: row.gracePeriodMs,
      lastCheckInAt: row.lastCheckInAt,
      nextDeadlineAt: row.nextDeadlineAt,
      graceStartedAt: row.graceStartedAt ?? null,
      checkInStreak: row.checkInStreak ?? 0,
    }
  },
})

/**
 * Arm the switch with a chosen cadence (called from onboarding "Arm my vault").
 * Read-before-insert keeps exactly one row per owner (getSwitchState uses .unique(),
 * which throws on duplicates). Re-arming updates config and counts as a check-in.
 */
export const armSwitch = mutation({
  args: { checkInIntervalMs: v.number(), gracePeriodMs: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const now = Date.now()
    const existing = await loadSwitch(ctx, ownerId)

    if (existing !== null) {
      const recovered = existing.state !== "active"
      await ctx.db.patch(existing._id, {
        checkInIntervalMs: args.checkInIntervalMs,
        gracePeriodMs: args.gracePeriodMs,
        state: "active",
        lastCheckInAt: now,
        nextDeadlineAt: now + args.checkInIntervalMs,
        graceStartedAt: undefined,
        pendingVerificationStartedAt: undefined,
        checkInStreak: recovered ? 1 : (existing.checkInStreak ?? 0) + 1,
      })
      if (recovered) {
        await logStateChange(ctx, ownerId, ownerId, existing.state, "active")
        // Alive — any death report still under review is stale and must not
        // stay approvable.
        await autoResolveDeathCase(ctx, ownerId, now)
      }
    } else {
      // Entitlement is required ONLY to CREATE a switch (first arm). NEVER gate the
      // patch branch above or any maintenance/check-in path — a lapsed trial must never
      // stall a living owner's switch (that would auto-release their estate).
      await assertEntitled(ctx, ownerId)
      await ctx.db.insert("switchState", {
        ownerId,
        checkInIntervalMs: args.checkInIntervalMs,
        gracePeriodMs: args.gracePeriodMs,
        state: "active",
        lastCheckInAt: now,
        nextDeadlineAt: now + args.checkInIntervalMs,
        requireDeathVerification: true,
        checkInStreak: 1,
      })
      await logStateChange(ctx, ownerId, ownerId, null, "active")
    }
    await ctx.db.insert("checkIns", { ownerId, source: "manual" })
  },
})

/**
 * Edit the cadence / grace period from Settings WITHOUT counting as a check-in.
 * Unlike `armSwitch`, this never bumps the streak or inserts a `checkIns` row — it
 * only re-times the next deadline so a config change doesn't masquerade as a
 * heartbeat. On an "active" row the deadline rebases on the last real check-in
 * (`lastCheckInAt + interval`); in "grace" it rebases on `graceStartedAt + grace`.
 * Lazily arms (insert "active") for owners who never explicitly armed.
 */
export const updateSwitchConfig = mutation({
  args: { checkInIntervalMs: v.number(), gracePeriodMs: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const now = Date.now()
    const existing = await loadSwitch(ctx, ownerId)

    if (existing === null) {
      // Lazy first-arm — gate it like armSwitch's create branch. The patch path below
      // (an existing switch) is NEVER gated, so a lapsed trial can't stall a live owner.
      await assertEntitled(ctx, ownerId)
      await ctx.db.insert("switchState", {
        ownerId,
        checkInIntervalMs: args.checkInIntervalMs,
        gracePeriodMs: args.gracePeriodMs,
        state: "active",
        lastCheckInAt: now,
        nextDeadlineAt: now + args.checkInIntervalMs,
        requireDeathVerification: true,
        checkInStreak: 1,
      })
      await ctx.db.insert("checkIns", { ownerId, source: "manual" })
      await logStateChange(ctx, ownerId, ownerId, null, "active")
      return
    }

    // Rebase the next transition on the new config, preserving the current state.
    const nextDeadlineAt =
      existing.state === "active"
        ? existing.lastCheckInAt + args.checkInIntervalMs
        : existing.state === "grace"
          ? (existing.graceStartedAt ?? now) + args.gracePeriodMs
          : existing.nextDeadlineAt
    await ctx.db.patch(existing._id, {
      checkInIntervalMs: args.checkInIntervalMs,
      gracePeriodMs: args.gracePeriodMs,
      nextDeadlineAt,
    })
  },
})

/**
 * Record a heartbeat ("I'm here"). Lazily arms with defaults for users who
 * onboarded before the switch existed. A live owner checking in always recovers
 * the row to "active" — safe in this slice because nothing has released.
 */
export const recordCheckIn = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const now = Date.now()
    const existing = await loadSwitch(ctx, ownerId)

    if (existing === null) {
      // Lazy first-arm only — gated. Reaching here means there is NO switch yet, so the
      // gate can never stall an existing armed switch. The patch path below (a real
      // heartbeat on an existing switch) is NEVER gated.
      await assertEntitled(ctx, ownerId)
      await ctx.db.insert("switchState", {
        ownerId,
        checkInIntervalMs: DEFAULT_INTERVAL_MS,
        gracePeriodMs: DEFAULT_GRACE_MS,
        state: "active",
        lastCheckInAt: now,
        nextDeadlineAt: now + DEFAULT_INTERVAL_MS,
        requireDeathVerification: true,
        checkInStreak: 1,
      })
      await ctx.db.insert("checkIns", { ownerId, source: "manual" })
      await logStateChange(ctx, ownerId, ownerId, null, "active")
      return
    }

    const recovered = existing.state !== "active"
    await ctx.db.patch(existing._id, {
      state: "active",
      lastCheckInAt: now,
      nextDeadlineAt: now + existing.checkInIntervalMs,
      graceStartedAt: undefined,
      pendingVerificationStartedAt: undefined,
      checkInStreak: recovered ? 1 : (existing.checkInStreak ?? 0) + 1,
    })
    await ctx.db.insert("checkIns", { ownerId, source: "manual" })
    await logCheckIn(ctx, ownerId)
    if (recovered) {
      await logStateChange(ctx, ownerId, ownerId, existing.state, "active")
      // The owner is alive — auto-reject any death report still under review so
      // a stale case can't be approved later (it would release a living owner's
      // estate). The submitter is notified and can re-report if needed.
      await autoResolveDeathCase(ctx, ownerId, now)
    }
  },
})

/**
 * Cron sweep: advance overdue rows through the state machine. One index serves
 * both transitions because `nextDeadlineAt` is repurposed as the grace deadline on
 * entry to grace. STOPS at "pendingVerification" — release authorization is a
 * separate feature. Batched + self-rescheduling to stay within transaction limits.
 */
export const sweepSwitch = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // active → grace (missed a check-in deadline)
    const overdueActive = await ctx.db
      .query("switchState")
      .withIndex("by_state_and_nextDeadlineAt", (q) =>
        q.eq("state", "active").lt("nextDeadlineAt", now)
      )
      .take(SWEEP_BATCH)
    for (const row of overdueActive) {
      await ctx.db.patch(row._id, {
        state: "grace",
        graceStartedAt: now,
        nextDeadlineAt: now + row.gracePeriodMs, // becomes the grace deadline
        checkInStreak: 0,
      })
      await logStateChange(ctx, row.ownerId, "system", "active", "grace")
      // Warn the owner their grace countdown started (skip if profile unknown).
      const profile = await resolveProfile(ctx, row.ownerId)
      if (profile?.email) {
        await enqueueNotification(ctx, {
          ownerId: row.ownerId,
          recipientEmail: profile.email,
          kind: "heartbeat_warning",
          payload: { graceEndsAt: String(now + row.gracePeriodMs) },
        })
      }
    }

    // grace → pendingVerification (grace lapsed). Just-graced rows have a future
    // deadline, so they're excluded here and swept on a later run.
    const overdueGrace = await ctx.db
      .query("switchState")
      .withIndex("by_state_and_nextDeadlineAt", (q) =>
        q.eq("state", "grace").lt("nextDeadlineAt", now)
      )
      .take(SWEEP_BATCH)
    for (const row of overdueGrace) {
      await ctx.db.patch(row._id, {
        state: "pendingVerification",
        pendingVerificationStartedAt: now,
      })
      await logStateChange(ctx, row.ownerId, "system", "grace", "pendingVerification")
    }

    // pendingVerification → released (LONGSTOP backstop). The primary release path is
    // admin approval of a death certificate (release.reviewDeathVerification); this is
    // the safety net for owners who configured a `longstopMs` and whose verification
    // never arrives. Only fires once the longstop has elapsed since entering pending.
    const pending = await ctx.db
      .query("switchState")
      .withIndex("by_state_and_nextDeadlineAt", (q) => q.eq("state", "pendingVerification"))
      .take(SWEEP_BATCH)
    for (const row of pending) {
      if (row.longstopMs == null || row.pendingVerificationStartedAt == null) continue
      if (row.pendingVerificationStartedAt + row.longstopMs > now) continue
      await authorizeRelease(ctx, row.ownerId, "system:longstop")
    }

    // A full batch may mean more remain — continue without blowing the txn limit.
    if (
      overdueActive.length === SWEEP_BATCH ||
      overdueGrace.length === SWEEP_BATCH ||
      pending.length === SWEEP_BATCH
    ) {
      await ctx.scheduler.runAfter(0, internal.switch.sweepSwitch, {})
    }
  },
})
