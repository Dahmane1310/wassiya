import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// A beneficiary-user's release keypair — one per person (`userId` = WorkOS
// tokenIdentifier). The PRIVATE half is recovery-wrapped client-side before it
// arrives here, so the server stores only ciphertext + the public key. Enrollment
// is WRITE-ONCE: overwriting the public key would orphan every DEK already wrapped
// to the old one. Key rotation / re-enrollment is a separate owner-driven flow.

/** Whether the current user has enrolled a release keypair (+ its fingerprint for
 *  display). Drives the web enrollment page (skip if already enrolled). */
export const getMyRecipientStatus = query({
  args: {},
  returns: v.object({
    enrolled: v.boolean(),
    keyFingerprint: v.union(v.string(), v.null()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return { enrolled: false, keyFingerprint: null }
    const row = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique()
    return { enrolled: row !== null, keyFingerprint: row?.keyFingerprint ?? null }
  },
})

/**
 * Store the current user's release keypair envelope (public key + recovery-wrapped
 * private key). Write-once. After enrolling, every beneficiary row that links to
 * this user becomes releasable, so they're flipped to `enrolled` — the owner's
 * reconciliation pass then wraps their assets' DEKs to this public key.
 */
export const enrollKeypair = mutation({
  args: {
    publicKey: v.string(),
    keyFingerprint: v.string(),
    recoverySalt: v.string(),
    wrappedPrivateKey: v.string(),
    wrappedPrivateKeyIv: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const userId = identity.tokenIdentifier
    const existing = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
    if (existing !== null) {
      throw new Error("ALREADY_ENROLLED")
    }
    await ctx.db.insert("recipientKeys", {
      userId,
      publicKey: args.publicKey,
      keyFingerprint: args.keyFingerprint,
      recoverySalt: args.recoverySalt,
      wrappedPrivateKey: args.wrappedPrivateKey,
      wrappedPrivateKeyIv: args.wrappedPrivateKeyIv,
    })
    const linked = await ctx.db
      .query("beneficiaries")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", userId))
      .take(200)
    for (const b of linked) {
      if (b.status !== "enrolled") {
        await ctx.db.patch(b._id, { status: "enrolled" })
      }
    }
    return null
  },
})
