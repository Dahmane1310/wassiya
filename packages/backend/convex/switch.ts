import { v } from "convex/values"
import { internal } from "./_generated/api"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"

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
      }
    } else {
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
    // TODO(release): once release ships, recovering from "pendingVerification" must
    // also clear recorded death attestations + reset deathVerification, so a
    // recover-then-re-lapse can't reuse stale attestations to short-circuit release.
    await ctx.db.patch(existing._id, {
      state: "active",
      lastCheckInAt: now,
      nextDeadlineAt: now + existing.checkInIntervalMs,
      graceStartedAt: undefined,
      pendingVerificationStartedAt: undefined,
      checkInStreak: recovered ? 1 : (existing.checkInStreak ?? 0) + 1,
    })
    await ctx.db.insert("checkIns", { ownerId, source: "manual" })
    if (recovered) {
      await logStateChange(ctx, ownerId, ownerId, existing.state, "active")
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

    // A full batch may mean more remain — continue without blowing the txn limit.
    if (
      overdueActive.length === SWEEP_BATCH ||
      overdueGrace.length === SWEEP_BATCH
    ) {
      await ctx.scheduler.runAfter(0, internal.switch.sweepSwitch, {})
    }
  },
})
