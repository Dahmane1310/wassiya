import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { type Id } from "./_generated/dataModel"

// Only the owner's private LABEL (their note/name for the person) is encrypted.
// contactEmail is plaintext so the server can send the invite + release notice.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

/** True if any Wasiyyah allocation still points at this beneficiary — removing one
 *  that does would orphan a configured (legal) bequest, so callers must block it. */
export async function beneficiaryHasAllocation(
  ctx: MutationCtx,
  beneficiaryId: Id<"beneficiaries">
): Promise<boolean> {
  const alloc = await ctx.db
    .query("wasiyyahAllocations")
    .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", beneficiaryId))
    .first()
  return alloc !== null
}

/** Delete a beneficiary row + its per-asset wrapped keys + pending invites. Plain
 *  helper (not a mutation) so it composes inside a caller's transaction — reused by
 *  removeBeneficiary AND familyMembers.removeFamilyMember (heir → linked beneficiary).
 *  Does NOT check the Wasiyyah guard; the caller decides whether to block. */
export async function cascadeDeleteBeneficiary(
  ctx: MutationCtx,
  beneficiaryId: Id<"beneficiaries">
): Promise<void> {
  const keys = await ctx.db
    .query("wrappedKeys")
    .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", beneficiaryId))
    .take(500)
  for (const k of keys) await ctx.db.delete(k._id)
  const invites = await ctx.db
    .query("invites")
    .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", beneficiaryId))
    .take(200)
  for (const i of invites) await ctx.db.delete(i._id)
  await ctx.db.delete(beneficiaryId)
}

/** The owner's beneficiaries (people who may decrypt the vault after release).
 *  `isHeir` is true when a family member links to this beneficiary — heirs are
 *  managed on the Heirs screen and excluded from the standalone Beneficiaries list. */
export const listBeneficiaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return []
    }
    const ownerId = identity.tokenIdentifier
    const rows = await ctx.db
      .query("beneficiaries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(200)
    const heirs = await ctx.db
      .query("familyMembers")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(200)
    const heirLinked = new Set(
      heirs.map((h) => h.linkedBeneficiaryId).filter(Boolean) as Id<"beneficiaries">[]
    )
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      contactEmail: r.contactEmail,
      status: r.status,
      // `enrolled` ⟺ the linked user has stored a release keypair (recipientKeys);
      // `enrollKeypair`/`redeemInvite` keep `status` in sync with that.
      enrolled: r.status === "enrolled",
      linkedUserId: r.linkedUserId ?? null,
      label: r.label ?? null,
      isHeir: heirLinked.has(r._id),
    }))
  },
})

/** Add a beneficiary. Deduped by (owner, email): re-adding an existing email returns
 *  that row (optionally refreshing the label) instead of creating a duplicate. */
export const addBeneficiary = mutation({
  args: { contactEmail: v.string(), label: v.optional(encrypted) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const email = args.contactEmail.trim().toLowerCase()
    const existing = await ctx.db
      .query("beneficiaries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(200)
    const dupe = existing.find((b) => b.contactEmail === email)
    if (dupe) {
      if (args.label !== undefined) await ctx.db.patch(dupe._id, { label: args.label })
      return dupe._id
    }
    return await ctx.db.insert("beneficiaries", {
      ownerId,
      contactEmail: email,
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
    // Don't silently drop a configured legal bequest — the client surfaces this.
    if (await beneficiaryHasAllocation(ctx, args.id)) {
      throw new Error("HAS_WASIYYAH_ALLOCATION")
    }
    await cascadeDeleteBeneficiary(ctx, args.id)
  },
})
