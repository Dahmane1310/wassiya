import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })
const scope = v.union(
  v.literal("full"),
  v.literal("debts_only"),
  v.literal("attest_only"),
  v.literal("coordinate")
)

/** Estate administrators — may attest death + coordinate release; need not inherit. */
export const listExecutors = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return []
    }
    const rows = await ctx.db
      .query("executors")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .order("desc")
      .take(200)
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      contactEmail: r.contactEmail,
      scope: r.scope,
      linkedUserId: r.linkedUserId ?? null,
      label: r.label ?? null,
    }))
  },
})

export const addExecutor = mutation({
  args: { contactEmail: v.string(), scope, label: v.optional(encrypted) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    return await ctx.db.insert("executors", {
      ownerId: identity.tokenIdentifier,
      contactEmail: args.contactEmail.trim().toLowerCase(),
      scope: args.scope,
      label: args.label,
    })
  },
})

export const updateExecutor = mutation({
  args: {
    id: v.id("executors"),
    contactEmail: v.optional(v.string()),
    scope: v.optional(scope),
    label: v.optional(encrypted),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const row = await ctx.db.get(args.id)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    await ctx.db.patch(args.id, {
      ...(args.contactEmail !== undefined
        ? { contactEmail: args.contactEmail.trim().toLowerCase() }
        : {}),
      ...(args.scope !== undefined ? { scope: args.scope } : {}),
      ...(args.label !== undefined ? { label: args.label } : {}),
    })
  },
})

export const removeExecutor = mutation({
  args: { id: v.id("executors") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const row = await ctx.db.get(args.id)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_executorId", (q) => q.eq("executorId", args.id))
      .take(200)
    for (const i of invites) await ctx.db.delete(i._id)
    await ctx.db.delete(args.id)
  },
})
