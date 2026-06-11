import { v } from "convex/values"
import { query } from "../_generated/server"
import { requireAdmin, resolveProfile } from "../lib/adminAuth"

// Beneficiary support lookup: "I got an invite / I can't open my legacy — who
// named me?" Search by contact email (stored lowercase, indexed). Exposes the
// key FINGERPRINT (verification support calls) — never key material or labels.

export const searchBeneficiaries = query({
  args: { email: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("beneficiaries"),
      _creationTime: v.number(),
      contactEmail: v.string(),
      status: v.string(),
      linked: v.boolean(),
      ownerId: v.string(),
      ownerEmail: v.union(v.string(), v.null()),
      ownerName: v.union(v.string(), v.null()),
      keyFingerprint: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const email = args.email.trim().toLowerCase()
    if (email === "") return []
    const rows = await ctx.db
      .query("beneficiaries")
      .withIndex("by_contactEmail", (q) => q.eq("contactEmail", email))
      .take(25)
    const out = []
    for (const b of rows) {
      const ownerProfile = await resolveProfile(ctx, b.ownerId)
      let keyFingerprint: string | null = null
      if (b.linkedUserId !== undefined) {
        const keys = await ctx.db
          .query("recipientKeys")
          .withIndex("by_userId", (q) => q.eq("userId", b.linkedUserId!))
          .unique()
        keyFingerprint = keys?.keyFingerprint ?? null
      }
      out.push({
        _id: b._id,
        _creationTime: b._creationTime,
        contactEmail: b.contactEmail,
        status: b.status,
        linked: b.linkedUserId !== undefined,
        ownerId: b.ownerId,
        ownerEmail: ownerProfile?.email ?? null,
        ownerName: b.ownerName ?? null,
        keyFingerprint,
      })
    }
    return out
  },
})
