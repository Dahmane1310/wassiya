import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Only the owner's private LABEL (their note/name for the person) is encrypted.
// contactEmail is plaintext so the server can send the invite + release notice.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

/** The owner's beneficiaries (people who may decrypt the vault after release). */
export const listBeneficiaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return []
    }
    const rows = await ctx.db
      .query("beneficiaries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .order("desc")
      .take(200)
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      contactEmail: r.contactEmail,
      status: r.status,
      // Don't ship the public key itself; just whether they've enrolled one.
      enrolled: r.publicKey != null,
      linkedUserId: r.linkedUserId ?? null,
      label: r.label ?? null,
    }))
  },
})

export const addBeneficiary = mutation({
  args: { contactEmail: v.string(), label: v.optional(encrypted) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    return await ctx.db.insert("beneficiaries", {
      ownerId: identity.tokenIdentifier,
      contactEmail: args.contactEmail.trim().toLowerCase(),
      status: "invited",
      label: args.label,
    })
  },
})

export const updateBeneficiary = mutation({
  args: { id: v.id("beneficiaries"), contactEmail: v.optional(v.string()), label: v.optional(encrypted) },
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
      ...(args.label !== undefined ? { label: args.label } : {}),
    })
  },
})

export const removeBeneficiary = mutation({
  args: { id: v.id("beneficiaries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const row = await ctx.db.get(args.id)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    // Clean up any per-asset wrapped keys + pending invites pointing at them.
    const keys = await ctx.db
      .query("wrappedKeys")
      .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", args.id))
      .take(500)
    for (const k of keys) await ctx.db.delete(k._id)
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", args.id))
      .take(200)
    for (const i of invites) await ctx.db.delete(i._id)
    await ctx.db.delete(args.id)
  },
})
