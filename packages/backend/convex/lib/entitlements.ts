import { ConvexError } from "convex/values"
import { type QueryCtx } from "../_generated/server"

// Shared entitlement helpers. Plain functions (not registered Convex functions) so
// they compose inside any query/mutation transaction — same pattern as
// beneficiaries.ts's cascadeDeleteBeneficiary.
//
// MODEL: try-then-pay. A 14-day trial begins at vault setup; after it lapses (no
// payment) the vault is read-only — see the gates in assets.ts / switch.ts.
//
// SAFETY: `isEntitled` reads wall-clock (`now`) and so MUST only be called from
// mutations, never from a reactive query (a query that branches on Date.now() freezes
// reactivity — see switch.ts:48-52). The `getEntitlement` query returns the raw
// `currentPeriodEnd` and lets the client derive the countdown; the cron keeps `status`
// fresh for real rows.

export const TRIAL_MS = 14 * 24 * 60 * 60 * 1000 // 14-day trial — single tunable knob.

export type Plan = "trial" | "annual" | "lifetime"
export type EntitlementStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"

// Normalized view of an owner's entitlement — either the stored row or a synthesized
// trial for users who predate this feature (anchored on the stable users._creationTime,
// which is durable data, not wall-clock, so reading it stays reactive-safe).
export type Entitlement = {
  plan: Plan
  status: EntitlementStatus
  currentPeriodEnd: number | null // trial end / period end; null = open trial or lifetime
  cancelAtPeriodEnd: boolean
  // True only when a concrete entitlements row exists (vs a synthesized trial).
  persisted: boolean
}

/**
 * The owner's entitlement. Falls back, in order, to: the stored row → a trial
 * synthesized from the existing `users` row's creation time → an open trial for a
 * not-yet-onboarded user (nothing to gate yet anyway). Never throws / never writes.
 */
export async function loadEntitlement(
  ctx: QueryCtx,
  ownerId: string,
): Promise<Entitlement> {
  const row = await ctx.db
    .query("entitlements")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique()
  if (row !== null) {
    return {
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd ?? false,
      persisted: true,
    }
  }
  // No row: synthesize a trial. Anchor on the users row if it exists.
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", ownerId))
    .unique()
  return {
    plan: "trial",
    status: "trialing",
    currentPeriodEnd: user !== null ? user._creationTime + TRIAL_MS : null,
    cancelAtPeriodEnd: false,
    persisted: false,
  }
}

/** Whether the owner currently has full (write) access — paid-and-current OR
 *  trial-and-current. MUTATION-ONLY (reads wall-clock). */
export function isEntitled(ent: Entitlement, now: number): boolean {
  if (ent.status === "active") {
    return ent.plan === "lifetime" || (ent.currentPeriodEnd ?? Infinity) > now
  }
  if (ent.status === "trialing") {
    return ent.currentPeriodEnd === null || ent.currentPeriodEnd > now
  }
  return false
}

/** Throw `TRIAL_EXPIRED` when the owner lacks write access. Call at gated mutation
 *  sites (asset create/edit, first switch arm). The client maps the code to a paywall.
 *  Uses ConvexError (not a plain Error): only the `.data` payload survives redaction to
 *  the client in production — a plain Error message arrives as "Server Error". */
export async function assertEntitled(
  ctx: QueryCtx,
  ownerId: string,
): Promise<void> {
  const ent = await loadEntitlement(ctx, ownerId)
  if (!isEntitled(ent, Date.now())) {
    throw new ConvexError("TRIAL_EXPIRED")
  }
}
