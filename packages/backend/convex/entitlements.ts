import { v } from "convex/values"
import { internal } from "./_generated/api"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { type Doc } from "./_generated/dataModel"
import { loadEntitlement, TRIAL_MS } from "./lib/entitlements"

// Subscription / entitlement API. The MODEL is try-then-pay: a 14-day trial starts at
// vault setup (see vault.completeVaultSetup), then the vault is read-only until the user
// buys `annual` or `lifetime`. Write-access gating lives in lib/entitlements.ts and is
// applied at assets.ts / switch.ts. NO crypto here.

const SWEEP_BATCH = 100

const planValidator = v.union(
  v.literal("trial"),
  v.literal("annual"),
  v.literal("lifetime"),
)
const sourceValidator = v.union(
  v.literal("trial"),
  v.literal("stripe"),
  v.literal("apple"),
  v.literal("google"),
  v.literal("manual"),
)

/**
 * The current user's entitlement (reactive). Returns the RAW `currentPeriodEnd` — never a
 * computed daysLeft / isActive: a query that branches on wall-clock is a reactive-cache
 * hazard (same reasoning as getSwitchState). The client derives the countdown / expired
 * state from the timestamp; the cron keeps `status` fresh for stored rows. Row-less users
 * get a trial synthesized from their account creation time.
 */
export const getEntitlement = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const ent = await loadEntitlement(ctx, identity.tokenIdentifier)
    return {
      plan: ent.plan,
      status: ent.status,
      currentPeriodEnd: ent.currentPeriodEnd,
      cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
    }
  },
})

/**
 * Apply a verified purchase to an owner's entitlement. SOURCE-AGNOSTIC core shared by
 * `grantEntitlement` (future Stripe/IAP verifier) and `manualGrant` (dashboard/testing).
 * Idempotent on `externalEventId`: a redelivered processor event is a no-op. Upserts the
 * entitlements row to an active paid plan and appends a billing-ledger row.
 */
export async function applyGrant(
  ctx: MutationCtx,
  args: {
    ownerId: string
    plan: "annual" | "lifetime"
    source: "trial" | "stripe" | "apple" | "google" | "manual"
    externalCustomerId?: string
    externalSubscriptionId?: string
    currentPeriodEnd?: number
    externalEventId?: string
    eventType: string
  },
): Promise<void> {
  // An annual plan MUST carry an expiry, or the patch below would clear the field and
  // mint a sub that never expires (silent free-lifetime). Enforce the contract here so the
  // future webhook author can't trip it via the optional validator.
  if (args.plan === "annual" && args.currentPeriodEnd == null) {
    throw new Error("annual grant requires currentPeriodEnd")
  }

  // Idempotency: skip if we've already processed this processor event.
  if (args.externalEventId !== undefined) {
    const seen = await ctx.db
      .query("billingEvents")
      .withIndex("by_externalEventId", (q) =>
        q.eq("externalEventId", args.externalEventId),
      )
      .first()
    if (seen !== null) {
      return
    }
  }

  const existing = await ctx.db
    .query("entitlements")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
    .unique()

  const fields = {
    plan: args.plan,
    status: "active" as const,
    source: args.source,
    externalCustomerId: args.externalCustomerId,
    externalSubscriptionId: args.externalSubscriptionId,
    // lifetime never expires → clear the anchor so the cron never touches it.
    currentPeriodEnd: args.plan === "lifetime" ? undefined : args.currentPeriodEnd,
    cancelAtPeriodEnd: false,
  }

  if (existing !== null) {
    await ctx.db.patch(existing._id, fields)
  } else {
    await ctx.db.insert("entitlements", { ownerId: args.ownerId, ...fields })
  }

  await ctx.db.insert("billingEvents", {
    ownerId: args.ownerId,
    source: args.source,
    externalEventId: args.externalEventId,
    type: args.eventType,
    plan: args.plan,
  })
}

/**
 * The documented entry point a FUTURE Stripe webhook / native-IAP verifier calls once it
 * has server-validated a purchase. Internal: never reachable from a client. (The HTTP
 * webhook handler that calls this is a later pass.)
 */
export const grantEntitlement = internalMutation({
  args: {
    ownerId: v.string(),
    plan: v.union(v.literal("annual"), v.literal("lifetime")),
    source: sourceValidator,
    externalCustomerId: v.optional(v.string()),
    externalSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    externalEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await applyGrant(ctx, { ...args, eventType: "granted" })
  },
})

/**
 * DEV-ONLY simulation of a purchase/trial state for the CURRENT user, so the whole
 * paywall/gating/trial UX can be built and exercised before RevenueCat/store setup exists.
 * DOUBLE-GUARDED: requires `ALLOW_DEV_ENTITLEMENT=true` in the Convex deployment env (set ONLY
 * on dev) AND `ownerId` is derived server-side. In production the flag is unset → this throws.
 * The client also only surfaces it under `__DEV__`.
 */
export const devSetEntitlement = mutation({
  args: {
    state: v.union(
      v.literal("trial"),
      v.literal("annual"),
      v.literal("lifetime"),
      v.literal("expired"),
    ),
  },
  handler: async (ctx, args) => {
    if (process.env.ALLOW_DEV_ENTITLEMENT !== "true") {
      throw new Error("dev entitlement simulation is disabled")
    }
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const now = Date.now()

    if (args.state === "annual" || args.state === "lifetime") {
      await applyGrant(ctx, {
        ownerId,
        plan: args.state,
        source: "manual",
        currentPeriodEnd:
          args.state === "annual" ? now + 365 * 24 * 60 * 60 * 1000 : undefined,
        externalEventId: `dev-${now}`, // unique each call so repeated sims aren't no-ops
        eventType: "dev_sim",
      })
      return
    }

    // trial / expired — set the trial row directly.
    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    const fields = {
      plan: "trial" as const,
      status: args.state === "trial" ? ("trialing" as const) : ("expired" as const),
      source: "trial" as const,
      currentPeriodEnd: args.state === "trial" ? now + TRIAL_MS : now - 1000,
      cancelAtPeriodEnd: false,
    }
    if (existing !== null) {
      await ctx.db.patch(existing._id, fields)
    } else {
      await ctx.db.insert("entitlements", { ownerId, ...fields })
    }
    await ctx.db.insert("billingEvents", {
      ownerId,
      source: "manual",
      type: "dev_sim",
      plan: "trial",
    })
  },
})

/** Dashboard / testing convenience: grant a plan to an owner by hand (source "manual").
 *  Lets the model be exercised end-to-end before checkout ships. */
export const manualGrant = internalMutation({
  args: {
    ownerId: v.string(),
    plan: v.union(v.literal("annual"), v.literal("lifetime")),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await applyGrant(ctx, {
      ownerId: args.ownerId,
      plan: args.plan,
      source: "manual",
      currentPeriodEnd: args.currentPeriodEnd,
      eventType: "manual_grant",
    })
  },
})

// ── RevenueCat (native IAP) ────────────────────────────────────────────────
// The client sets the RC `app_user_id` to the WorkOS `sub` (a clean ULID; the server's
// tokenIdentifier is URL-shaped and unsuitable). `linkPurchaseId` records that `sub` on the
// owner's entitlement so the RC webhook can resolve `app_user_id → owner`.

/** Resolve the entitlement row whose `externalCustomerId` (RC app_user_id) matches. */
async function findEntitlementByRcId(
  ctx: MutationCtx,
  rcAppUserId: string,
): Promise<Doc<"entitlements"> | null> {
  return await ctx.db
    .query("entitlements")
    .withIndex("by_externalCustomerId", (q) =>
      q.eq("externalCustomerId", rcAppUserId),
    )
    .first()
}

/** True if this processor event id was already recorded (idempotency). */
async function alreadyProcessed(
  ctx: MutationCtx,
  externalEventId: string | undefined,
): Promise<boolean> {
  if (externalEventId === undefined) return false
  const seen = await ctx.db
    .query("billingEvents")
    .withIndex("by_externalEventId", (q) =>
      q.eq("externalEventId", externalEventId),
    )
    .first()
  return seen !== null
}

/**
 * Link the device's RevenueCat `app_user_id` (= WorkOS `sub`) to this owner so the webhook
 * can attribute purchases. `ownerId` is derived SERVER-SIDE (never client-passed). Patches
 * the existing entitlement row, or creates the trial row if none exists yet (mirrors
 * completeVaultSetup). Never alters plan/status. Idempotent.
 */
export const linkPurchaseId = mutation({
  args: { rcAppUserId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (existing !== null) {
      if (existing.externalCustomerId !== args.rcAppUserId) {
        await ctx.db.patch(existing._id, { externalCustomerId: args.rcAppUserId })
      }
      return
    }
    await ctx.db.insert("entitlements", {
      ownerId,
      plan: "trial",
      status: "trialing",
      source: "trial",
      currentPeriodEnd: Date.now() + TRIAL_MS,
      externalCustomerId: args.rcAppUserId,
    })
  },
})

/**
 * RC webhook → grant. Resolves the owner from the RC `app_user_id`, then upserts an active
 * paid plan via the shared `applyGrant`. ONE mutation (lookup + grant) so the webhook action
 * makes a single call (no cross-call races). An unresolved id is recorded as
 * `unmatched_purchase` rather than written under a garbage owner. Idempotent on the RC event id.
 */
export const grantEntitlementByRcId = internalMutation({
  args: {
    rcAppUserId: v.string(),
    plan: v.union(v.literal("annual"), v.literal("lifetime")),
    source: sourceValidator,
    currentPeriodEnd: v.optional(v.number()),
    externalSubscriptionId: v.optional(v.string()),
    externalEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (await alreadyProcessed(ctx, args.externalEventId)) return
    const row = await findEntitlementByRcId(ctx, args.rcAppUserId)
    if (row === null) {
      await ctx.db.insert("billingEvents", {
        source: args.source,
        externalEventId: args.externalEventId,
        type: "unmatched_purchase",
        plan: args.plan,
        meta: { rcAppUserId: args.rcAppUserId },
      })
      return
    }
    await applyGrant(ctx, {
      ownerId: row.ownerId,
      plan: args.plan,
      source: args.source,
      currentPeriodEnd: args.currentPeriodEnd,
      externalSubscriptionId: args.externalSubscriptionId,
      externalCustomerId: args.rcAppUserId,
      externalEventId: args.externalEventId,
      eventType: "granted",
    })
  },
})

/**
 * RC webhook → revoke (EXPIRATION / REFUND). Patches the owner's status to expired/canceled.
 * REQUIRED for lifetime: the cron expires by `currentPeriodEnd`, which lifetime lacks, so a
 * refunded lifetime would otherwise keep premium forever. Idempotent on the RC event id.
 */
export const revokeEntitlementByRcId = internalMutation({
  args: {
    rcAppUserId: v.string(),
    status: v.union(v.literal("expired"), v.literal("canceled")),
    externalEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (await alreadyProcessed(ctx, args.externalEventId)) return
    const row = await findEntitlementByRcId(ctx, args.rcAppUserId)
    if (row === null) {
      await ctx.db.insert("billingEvents", {
        source: "manual",
        externalEventId: args.externalEventId,
        type: "unmatched_revoke",
        meta: { rcAppUserId: args.rcAppUserId },
      })
      return
    }
    await ctx.db.patch(row._id, { status: args.status })
    await ctx.db.insert("billingEvents", {
      ownerId: row.ownerId,
      source: row.source,
      externalEventId: args.externalEventId,
      type: "revoked",
      plan: row.plan,
    })
  },
})

/**
 * Cron sweep: expire entitlements whose period has elapsed. Scans each lapse-able status
 * separately (an index range can only pin one `status`). LIFETIME rows have no
 * `currentPeriodEnd`, but undefined sorts below every number so the range would still match
 * them — the explicit `continue` guard keeps lifetime untouched. Batched + self-rescheduling
 * like sweepSwitch.
 *
 * NOTE: this NEVER touches switchState. An owner who armed during the trial stays protected
 * forever even after expiry — gating the switch only at creation is what makes that safe.
 */
export const sweepEntitlements = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const lapseable = ["trialing", "active", "past_due"] as const
    let rescheduled = false

    for (const status of lapseable) {
      const rows = await ctx.db
        .query("entitlements")
        .withIndex("by_status_and_currentPeriodEnd", (q) =>
          // gte(0) excludes lifetime rows (currentPeriodEnd undefined sorts below 0):
          // without the lower bound they'd fill every batch and loop the sweep forever.
          q.eq("status", status).gte("currentPeriodEnd", 0).lt("currentPeriodEnd", now),
        )
        .take(SWEEP_BATCH)
      for (const row of rows) {
        if (row.currentPeriodEnd === undefined) {
          continue // belt-and-suspenders — the range above already excludes these
        }
        await ctx.db.patch(row._id, { status: "expired" })
        await ctx.db.insert("billingEvents", {
          ownerId: row.ownerId,
          source: row.source,
          type: "expired",
          plan: row.plan,
        })
      }
      if (rows.length === SWEEP_BATCH && !rescheduled) {
        await ctx.scheduler.runAfter(0, internal.entitlements.sweepEntitlements, {})
        rescheduled = true
      }
    }
  },
})
