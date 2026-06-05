import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authKit } from "./auth"

// Protected query. A non-null result proves the WorkOS JWT reached Convex and
// `auth.config.ts` validated it. `email`/`firstName`/`lastName` come from the
// synced user store (populated by the WorkOS webhook), not the JWT — so
// `synced: true` also confirms the webhook fired. `ownerGender` is app-side
// (the `users` row), used by the Fara'id engine.
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const user = await authKit.getAuthUser(ctx)
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    return {
      subject: identity.subject,
      email: user?.email ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      ownerGender: appUser?.ownerGender ?? null,
      synced: user !== null,
    }
  },
})

/** Set the owner's (deceased's) gender — required by the Fara'id engine when a
 *  spouse is present. Patches the existing `users` row (created at vault setup). */
export const setOwnerGender = mutation({
  args: { gender: v.union(v.literal("male"), v.literal("female")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const row = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (row === null) {
      throw new Error("Vault not set up")
    }
    await ctx.db.patch(row._id, { ownerGender: args.gender })
  },
})
