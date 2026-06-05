import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Mirrors the `encrypted` column validator in schema.ts — only the heir's NAME
// (PII) is encrypted; structural fields (relationship/lineage/gender/isAlive) are
// plaintext because the Fara'id engine must read them (CLAUDE.md §4).
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

const relationship = v.union(
  v.literal("spouse"),
  v.literal("father"),
  v.literal("mother"),
  v.literal("son"),
  v.literal("daughter"),
  v.literal("brother"),
  v.literal("sister"),
  v.literal("grandfather"),
  v.literal("grandmother"),
  v.literal("grandson"),
  v.literal("granddaughter"),
  v.literal("other")
)
const lineage = v.union(v.literal("full"), v.literal("paternal"), v.literal("maternal"))
const gender = v.union(v.literal("male"), v.literal("female"))

/** The owner's family tree (structural fields + encrypted name), newest first.
 *  `ownerId` is omitted — the caller IS the owner. */
export const listFamilyMembers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return []
    }
    const rows = await ctx.db
      .query("familyMembers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .order("desc")
      .take(200)
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      relationship: r.relationship,
      lineage: r.lineage ?? null,
      gender: r.gender,
      isAlive: r.isAlive,
      parentMemberId: r.parentMemberId ?? null,
      name: r.name,
      linkedBeneficiaryId: r.linkedBeneficiaryId ?? null,
    }))
  },
})

export const addFamilyMember = mutation({
  args: {
    relationship,
    lineage: v.optional(lineage),
    gender,
    isAlive: v.boolean(),
    parentMemberId: v.optional(v.id("familyMembers")),
    name: encrypted,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    if (args.parentMemberId) {
      const parent = await ctx.db.get(args.parentMemberId)
      if (parent === null || parent.ownerId !== ownerId) {
        throw new Error("Invalid parent member")
      }
    }
    return await ctx.db.insert("familyMembers", { ownerId, ...args })
  },
})

export const updateFamilyMember = mutation({
  args: {
    id: v.id("familyMembers"),
    relationship: v.optional(relationship),
    lineage: v.optional(lineage),
    gender: v.optional(gender),
    isAlive: v.optional(v.boolean()),
    name: v.optional(encrypted),
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
    const { id, ...patch } = args
    await ctx.db.patch(id, patch)
  },
})

export const removeFamilyMember = mutation({
  args: { id: v.id("familyMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const row = await ctx.db.get(args.id)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    // Detach any children so we never leave a dangling parentMemberId edge.
    const children = await ctx.db
      .query("familyMembers")
      .withIndex("by_parentMemberId", (q) => q.eq("parentMemberId", args.id))
      .take(200)
    for (const child of children) {
      await ctx.db.patch(child._id, { parentMemberId: undefined })
    }
    await ctx.db.delete(args.id)
  },
})
