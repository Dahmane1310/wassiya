import { ConvexError } from "convex/values"
import type { UserIdentity } from "convex/server"
import type { QueryCtx } from "../_generated/server"

// The support-disable wall. A `disabledAccounts` row (admin/users.ts) blocks the
// account from every owner/beneficiary-facing function while keeping the WorkOS
// account and all vault data intact — so re-enabling restores access losslessly.
// Admin functions are NOT routed through here (admins are governed by `admins`).

export async function isAccountDisabled(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<boolean> {
  const row = await ctx.db
    .query("disabledAccounts")
    .withIndex("by_accountId", (q) => q.eq("accountId", tokenIdentifier))
    .unique()
  return row !== null
}

/** Identity for mutations / throwing queries: unauthenticated throws (redacted
 *  plain Error, as before); a disabled account throws ConvexError so clients can
 *  key on `.data === "ACCOUNT_DISABLED"` in prod. */
export async function requireEnabledUser(ctx: QueryCtx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    throw new Error("Not authenticated")
  }
  if (await isAccountDisabled(ctx, identity.tokenIdentifier)) {
    throw new ConvexError("ACCOUNT_DISABLED")
  }
  return identity
}

/** Identity for queries that return an empty default when unauthenticated.
 *  Disabled accounts also get null (→ the empty default): reactive queries must
 *  not throw mid-session when support disables an account — the gate queries
 *  (vault.getVaultStatus / recipients status) carry an explicit `disabled` flag
 *  and own the user-facing state. */
export async function getEnabledUser(ctx: QueryCtx): Promise<UserIdentity | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return null
  if (await isAccountDisabled(ctx, identity.tokenIdentifier)) return null
  return identity
}
