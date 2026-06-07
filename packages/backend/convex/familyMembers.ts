import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { type Id } from "./_generated/dataModel"
import {
  beneficiaryHasAllocation,
  cascadeDeleteBeneficiary,
} from "./beneficiaries"

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

/**
 * Every heir is a beneficiary: ensure a beneficiary row exists for `email` and link
 * the heir to it. Dedupes against an existing same-email beneficiary (e.g. a
 * non-heir recipient already added). The heir's encrypted `name` doubles as the
 * beneficiary's private `label` (identical AES-GCM/master-key envelope). Returns the
 * linked beneficiary id.
 */
async function linkBeneficiary(
  ctx: MutationCtx,
  ownerId: string,
  heirId: Id<"familyMembers">,
  email: string,
  label: { ciphertext: string; iv: string }
): Promise<Id<"beneficiaries">> {
  const normalized = email.trim().toLowerCase()
  const existing = await ctx.db
    .query("beneficiaries")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .take(200)
  const dupe = existing.find((b) => b.contactEmail === normalized)
  const beneficiaryId =
    dupe?._id ??
    (await ctx.db.insert("beneficiaries", {
      ownerId,
      contactEmail: normalized,
      status: "invited",
      label,
    }))
  if (dupe) await ctx.db.patch(dupe._id, { label })
  await ctx.db.patch(heirId, { linkedBeneficiaryId: beneficiaryId })
  return beneficiaryId
}

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
    // Optional: when present, the heir is also enrolled as a (decrypting) beneficiary.
    contactEmail: v.optional(v.string()),
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
    const { contactEmail, ...heir } = args
    const heirId = await ctx.db.insert("familyMembers", { ownerId, ...heir })
    if (contactEmail && contactEmail.trim()) {
      await linkBeneficiary(ctx, ownerId, heirId, contactEmail, args.name)
    }
    return heirId
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
    // Optional: add/replace the heir's email → create or update the linked beneficiary.
    contactEmail: v.optional(v.string()),
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
    const { id, contactEmail, ...patch } = args
    await ctx.db.patch(id, patch)

    // Keep the linked beneficiary in sync. The heir's (possibly new) name is the
    // beneficiary's private label.
    const label = args.name ?? row.name
    if (row.linkedBeneficiaryId) {
      const bPatch: { contactEmail?: string; label?: typeof label } = {}
      if (contactEmail && contactEmail.trim()) bPatch.contactEmail = contactEmail.trim().toLowerCase()
      if (args.name) bPatch.label = args.name
      if (Object.keys(bPatch).length > 0) await ctx.db.patch(row.linkedBeneficiaryId, bPatch)
    } else if (contactEmail && contactEmail.trim()) {
      await linkBeneficiary(ctx, row.ownerId, id, contactEmail, label)
    }
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
    // Removing the heir also removes their decryption access. Block (don't silently
    // drop) if a Wasiyyah bequest still points at the linked beneficiary.
    if (row.linkedBeneficiaryId) {
      if (await beneficiaryHasAllocation(ctx, row.linkedBeneficiaryId)) {
        throw new Error("HAS_WASIYYAH_ALLOCATION")
      }
      await cascadeDeleteBeneficiary(ctx, row.linkedBeneficiaryId)
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
