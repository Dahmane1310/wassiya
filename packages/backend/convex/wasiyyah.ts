import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getEnabledUser, requireEnabledUser } from "./lib/account"

// The freely-willed bequest, modelled as PERCENTAGES of the (net) estate so the
// server can enforce the Sharia one-third cap WITHOUT ever seeing a value. The
// sum across an owner MUST stay ≤ 100/3 (33.3…%) — validated on every write.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })
const CAP = 100 / 3
const EPS = 1e-6

/** All of the owner's Wasiyyah allocations (one row per beneficiary). */
export const listAllocations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getEnabledUser(ctx)
    if (identity === null) {
      return []
    }
    const rows = await ctx.db
      .query("wasiyyahAllocations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .order("desc")
      .take(200)
    return rows.map((r) => ({
      _id: r._id,
      beneficiaryId: r.beneficiaryId,
      percentage: r.percentage,
      note: r.note ?? null,
    }))
  },
})

/**
 * Set (upsert) a beneficiary's bequest percentage. Validates ownership of the
 * beneficiary and enforces the ⅓ cap: (sum of the OTHER allocations) + this one
 * must be ≤ 100/3. One allocation per (owner, beneficiary).
 */
export const setAllocation = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    percentage: v.number(),
    note: v.optional(encrypted),
  },
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const ownerId = identity.tokenIdentifier
    if (!Number.isFinite(args.percentage) || args.percentage < 0 || args.percentage > CAP + EPS) {
      throw new Error("Percentage out of range")
    }
    const beneficiary = await ctx.db.get(args.beneficiaryId)
    if (beneficiary === null || beneficiary.ownerId !== ownerId) {
      throw new Error("Beneficiary not found")
    }

    const all = await ctx.db
      .query("wasiyyahAllocations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(200)
    const existing = all.find((a) => a.beneficiaryId === args.beneficiaryId)
    const othersTotal = all
      .filter((a) => a.beneficiaryId !== args.beneficiaryId)
      .reduce((s, a) => s + a.percentage, 0)
    if (othersTotal + args.percentage > CAP + EPS) {
      throw new Error("Exceeds the one-third bequest cap")
    }

    if (existing) {
      await ctx.db.patch(existing._id, { percentage: args.percentage, note: args.note })
    } else {
      await ctx.db.insert("wasiyyahAllocations", {
        ownerId,
        beneficiaryId: args.beneficiaryId,
        percentage: args.percentage,
        note: args.note,
      })
    }
  },
})

export const removeAllocation = mutation({
  args: { id: v.id("wasiyyahAllocations") },
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const row = await ctx.db.get(args.id)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    await ctx.db.delete(args.id)
  },
})
