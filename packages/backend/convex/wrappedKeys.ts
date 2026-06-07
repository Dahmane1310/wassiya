import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Beneficiary key-wrapping — the release envelope. The owner's unlocked device is
// the ONLY place a DEK exists in plaintext, so wrapping DEKs to beneficiaries is a
// CLIENT-driven reconciliation, never a server job:
//   1. `listWrapGaps` reports (asset, enrolled-beneficiary) pairs missing a wrap.
//   2. The client unwraps each DEK under the master key, RSA-OAEP-wraps it to the
//      beneficiary's public key, and posts the results to `saveWrappedKeys`.
// The server never sees a DEK in the clear. The flow is idempotent + self-healing:
// a wrap that fails or is interrupted simply stays a gap the next pass refills, and
// `by_assetId_and_beneficiaryId` makes re-posting a no-op.

const MAX_ASSETS = 500
const MAX_BENEFICIARIES = 200
const GAP_PAGE = 40 // gaps returned per call → bounds the client's save batch
const MAX_SAVE = 60 // hard cap on one saveWrappedKeys mutation (txn write limit)

/**
 * The (asset, enrolled-beneficiary) pairs that still lack a wrapped key, with the
 * data the client needs to produce one: the owner-wrapped DEK (to unwrap under the
 * master key) and the beneficiary's public key (to re-wrap to). Bounded to one page
 * — the client loops until this returns empty. Because each saved wrap removes a
 * gap, paging needs no cursor: every call returns the next outstanding batch.
 */
export const listWrapGaps = query({
  args: {},
  returns: v.array(
    v.object({
      assetId: v.id("assets"),
      ownerWrappedKey: v.string(),
      ownerWrapIv: v.string(),
      beneficiaryId: v.id("beneficiaries"),
      publicKey: v.string(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return []
    const ownerId = identity.tokenIdentifier

    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_BENEFICIARIES)

    // Resolve each linked beneficiary's public key via its USER's recipient keypair
    // (one keypair per person, shared across the owners who name them). A beneficiary
    // who hasn't redeemed an invite (no linkedUserId) or hasn't enrolled (no
    // recipientKey) simply isn't wrappable yet — skip them.
    const recipients: Array<{
      beneficiaryId: (typeof beneficiaries)[number]["_id"]
      publicKey: string
    }> = []
    for (const b of beneficiaries) {
      if (b.linkedUserId == null) continue
      const rk = await ctx.db
        .query("recipientKeys")
        .withIndex("by_userId", (q) => q.eq("userId", b.linkedUserId!))
        .unique()
      if (rk !== null) recipients.push({ beneficiaryId: b._id, publicKey: rk.publicKey })
    }
    if (recipients.length === 0) return []

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_ASSETS)
    if (assets.length === 0) return []

    const gaps: Array<{
      assetId: (typeof assets)[number]["_id"]
      ownerWrappedKey: string
      ownerWrapIv: string
      beneficiaryId: (typeof beneficiaries)[number]["_id"]
      publicKey: string
    }> = []
    for (const r of recipients) {
      const existing = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", r.beneficiaryId))
        .take(MAX_ASSETS)
      const have = new Set(existing.map((k) => k.assetId as string))
      for (const a of assets) {
        if (have.has(a._id as string)) continue
        gaps.push({
          assetId: a._id,
          ownerWrappedKey: a.ownerWrappedKey,
          ownerWrapIv: a.ownerWrapIv,
          beneficiaryId: r.beneficiaryId,
          publicKey: r.publicKey,
        })
        if (gaps.length >= GAP_PAGE) return gaps
      }
    }
    return gaps
  },
})

/**
 * Persist DEKs the client wrapped to beneficiaries. Ownership of every asset AND
 * beneficiary is re-checked server-side; the (asset, beneficiary) pair is unique
 * (skipped if already wrapped) so retries are safe. `keyFingerprint` binds the wrap
 * to the public key it was made under, so a later key substitution is detectable.
 */
export const saveWrappedKeys = mutation({
  args: {
    entries: v.array(
      v.object({
        assetId: v.id("assets"),
        beneficiaryId: v.id("beneficiaries"),
        wrappedKey: v.string(),
        algorithm: v.string(),
        keyFingerprint: v.string(),
      })
    ),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    if (args.entries.length > MAX_SAVE) {
      throw new Error("TOO_MANY_WRAPPED_KEYS")
    }
    let inserted = 0
    let skipped = 0
    for (const e of args.entries) {
      const asset = await ctx.db.get(e.assetId)
      if (asset === null || asset.ownerId !== ownerId) {
        throw new Error("Asset not found")
      }
      const beneficiary = await ctx.db.get(e.beneficiaryId)
      if (beneficiary === null || beneficiary.ownerId !== ownerId) {
        throw new Error("Beneficiary not found")
      }
      const dupe = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_assetId_and_beneficiaryId", (q) =>
          q.eq("assetId", e.assetId).eq("beneficiaryId", e.beneficiaryId)
        )
        .first()
      if (dupe !== null) {
        skipped++
        continue
      }
      await ctx.db.insert("wrappedKeys", {
        assetId: e.assetId,
        beneficiaryId: e.beneficiaryId,
        wrappedKey: e.wrappedKey,
        algorithm: e.algorithm,
        keyFingerprint: e.keyFingerprint,
      })
      inserted++
    }
    return { inserted, skipped }
  },
})
