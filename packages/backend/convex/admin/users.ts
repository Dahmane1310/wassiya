import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { action, query } from "../_generated/server"
import { authKit } from "../auth"
import { issuerOf, requireAdmin, resolveProfile } from "../lib/adminAuth"
import { loadEntitlement } from "../lib/entitlements"

// Users browser. Lists app `users` rows (one per vault owner) enriched with the
// synced WorkOS profile, switch state, and entitlement — all per-page-row lookups,
// bounded by the page size. Identity/profile fields only; never vault content.

export const listUsers = query({
  args: {
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const result = await ctx.db
      .query("users")
      .order(args.order ?? "desc")
      .paginate(args.paginationOpts)
    const page = []
    for (const u of result.page) {
      const profile = await resolveProfile(ctx, u.tokenIdentifier)
      const sw = await ctx.db
        .query("switchState")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", u.tokenIdentifier))
        .unique()
      const ent = await loadEntitlement(ctx, u.tokenIdentifier)
      page.push({
        tokenIdentifier: u.tokenIdentifier,
        _creationTime: u._creationTime,
        email: profile?.email ?? null,
        name: profile?.name ?? null,
        onboardingComplete: u.onboardingComplete ?? false,
        switchState: sw?.state ?? null,
        entitlement: { plan: ent.plan, status: ent.status },
      })
    }
    return { ...result, page }
  },
})

/** Email → user lookup via the WorkOS API (the synced component store has no
 *  by-email index). Admin-gated through an internal query since actions lack db. */
export const findUserByEmail = action({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      tokenIdentifier: v.string(),
      email: v.string(),
      name: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const isAdmin: boolean = await ctx.runQuery(
      internal.admin.access.checkAdminInternal,
      {},
    )
    if (!isAdmin) throw new ConvexError("NOT_AUTHORIZED")
    const me = await ctx.auth.getUserIdentity()
    if (me === null) throw new ConvexError("NOT_AUTHORIZED")
    const res = await authKit.workos.userManagement.listUsers({
      email: args.email.trim().toLowerCase(),
    })
    const user = res.data[0]
    if (user === undefined) return null
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
    return {
      tokenIdentifier: `${issuerOf(me.tokenIdentifier)}|${user.id}`,
      email: user.email,
      name: name.length > 0 ? name : null,
    }
  },
})
