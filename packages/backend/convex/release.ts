import { v } from "convex/values"
import { computeFaraid, type Heir as EngineHeir } from "@workspace/faraid"
import { mutation, query, type MutationCtx } from "./_generated/server"

// Death verification + release authorization. Flow: any enrolled beneficiary of an
// owner submits a death certificate → an admin reviews it → on approval the switch
// is moved to "released" and the Fara'id/Wasiyyah distribution is frozen. Nothing
// releases on a beneficiary's word alone (admin approval, or the longstop backstop).

async function requireAdmin(ctx: MutationCtx, tokenIdentifier: string) {
  const row = await ctx.db
    .query("admins")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique()
  if (row === null) throw new Error("NOT_AUTHORIZED")
}

/** Upload URL for an encrypted death certificate (any authed user; the submitter). */
export const generateCertUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) throw new Error("Not authenticated")
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * A beneficiary reports an owner's death and submits a certificate for review. Only
 * an enrolled, linked beneficiary of that owner may report. Idempotent: if a review
 * is already pending/approved it is not duplicated.
 */
export const submitDeathReport = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    certificateStorageId: v.optional(v.id("_storage")),
    role: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) throw new Error("Not authenticated")
    const beneficiary = await ctx.db.get(args.beneficiaryId)
    if (beneficiary === null || beneficiary.linkedUserId !== identity.tokenIdentifier) {
      throw new Error("Not found")
    }
    const ownerId = beneficiary.ownerId
    const existing = await ctx.db
      .query("deathVerification")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (existing !== null && (existing.status === "approved" || existing.status === "under_review")) {
      return null // already in flight / done
    }
    const fields = {
      ownerId,
      status: "under_review" as const,
      certificateStorageId: args.certificateStorageId,
      submittedByKind: "beneficiary" as const,
      submittedByEmail: identity.email ?? undefined,
    }
    if (existing === null) await ctx.db.insert("deathVerification", fields)
    else await ctx.db.patch(existing._id, fields)
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: identity.tokenIdentifier,
      event: "death_cert_submitted",
      targetTable: "deathVerification",
    })
    return null
  },
})

/** Admin review queue: death verifications awaiting a decision, newest first. */
export const listReviewQueue = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("deathVerification"),
      _creationTime: v.number(),
      ownerId: v.string(),
      status: v.string(),
      submittedByEmail: v.union(v.string(), v.null()),
      hasCertificate: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return []
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique()
    if (admin === null) return []
    const rows = await ctx.db
      .query("deathVerification")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .order("desc")
      .take(100)
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      ownerId: r.ownerId,
      status: r.status,
      submittedByEmail: r.submittedByEmail ?? null,
      hasCertificate: r.certificateStorageId != null,
    }))
  },
})

/** Admin-only: signed URL to view a submitted certificate. */
export const getCertUrl = query({
  args: { id: v.id("deathVerification") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return null
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique()
    if (admin === null) return null
    const row = await ctx.db.get(args.id)
    if (row === null || row.certificateStorageId == null) return null
    return await ctx.storage.getUrl(row.certificateStorageId)
  },
})

/** Admin approve/reject. Approval authorizes release. */
export const reviewDeathVerification = mutation({
  args: {
    id: v.id("deathVerification"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) throw new Error("Not authenticated")
    await requireAdmin(ctx, identity.tokenIdentifier)
    const row = await ctx.db.get(args.id)
    if (row === null) throw new Error("Not found")
    await ctx.db.patch(args.id, {
      status: args.decision,
      reviewedBy: identity.tokenIdentifier,
      reviewedAt: Date.now(),
      reviewNotes: args.notes,
    })
    await ctx.db.insert("auditLog", {
      ownerId: row.ownerId,
      actor: `admin:${identity.tokenIdentifier}`,
      event: "death_cert_reviewed",
      targetTable: "deathVerification",
      meta: { decision: args.decision },
    })
    if (args.decision === "approved") {
      await authorizeRelease(ctx, row.ownerId, `admin:${identity.tokenIdentifier}`)
    }
    return null
  },
})

const encryptedShape = v.object({ ciphertext: v.string(), iv: v.string() })

/**
 * The released legacy for the signed-in beneficiary, under a specific owner. Returns
 * the data needed to decrypt ENTIRELY in the browser: the recovery-wrapped private
 * key (escrow) + each asset's DEK (wrapped to the beneficiary's public key) + the
 * encrypted payload + file URL/IV. Only returns when that owner is "released" AND
 * the caller is a linked beneficiary — otherwise null. The server still holds no key.
 */
export const getReleasedLegacy = query({
  args: { ownerId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      escrow: v.object({
        recoverySalt: v.string(),
        wrappedPrivateKey: v.string(),
        wrappedPrivateKeyIv: v.string(),
      }),
      items: v.array(
        v.object({
          assetId: v.id("assets"),
          wrappedKey: v.string(),
          algorithm: v.string(),
          payload: encryptedShape,
          fileUrl: v.union(v.string(), v.null()),
          fileIv: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return null
    const me = identity.tokenIdentifier
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .unique()
    if (sw === null || sw.state !== "released") return null

    const myBenef = (
      await ctx.db
        .query("beneficiaries")
        .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", me))
        .take(50)
    ).find((r) => r.ownerId === args.ownerId)
    if (!myBenef) return null

    const rk = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", me))
      .unique()
    if (rk === null) return null

    const wraps = await ctx.db
      .query("wrappedKeys")
      .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", myBenef._id))
      .take(500)
    const items: Array<{
      assetId: (typeof wraps)[number]["assetId"]
      wrappedKey: string
      algorithm: string
      payload: { ciphertext: string; iv: string }
      fileUrl: string | null
      fileIv: string | null
    }> = []
    for (const w of wraps) {
      const asset = await ctx.db.get(w.assetId)
      if (asset === null || asset.ownerId !== args.ownerId) continue
      items.push({
        assetId: w.assetId,
        wrappedKey: w.wrappedKey,
        algorithm: w.algorithm,
        payload: asset.payload,
        fileUrl: asset.storageId ? await ctx.storage.getUrl(asset.storageId) : null,
        fileIv: asset.fileIv ?? null,
      })
    }
    return {
      escrow: {
        recoverySalt: rk.recoverySalt,
        wrappedPrivateKey: rk.wrappedPrivateKey,
        wrappedPrivateKeyIv: rk.wrappedPrivateKeyIv,
      },
      items,
    }
  },
})

/**
 * DEV SEAM — authorize release immediately, skipping the check-in/grace timers, so
 * the release flow can be tested without waiting. DOUBLE-GUARDED: requires
 * `ALLOW_DEV_SEAMS=true` on the Convex deployment env (set on DEV only; unset in
 * prod → throws) AND the client only surfaces it under `__DEV__`. `ownerId` defaults
 * to the caller (a mobile owner triggering their own release); pass it explicitly to
 * run from the Convex dashboard. Calls the real `authorizeRelease`, so the frozen
 * distribution + audit log are written exactly as a genuine release.
 */
export const devAuthorizeRelease = mutation({
  args: { ownerId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (process.env.ALLOW_DEV_SEAMS !== "true") {
      throw new Error("dev seams are disabled")
    }
    const identity = await ctx.auth.getUserIdentity()
    const ownerId = args.ownerId ?? identity?.tokenIdentifier
    if (!ownerId) throw new Error("ownerId required")
    await authorizeRelease(ctx, ownerId, "dev:manual")
    return null
  },
})

/**
 * Authorize release for an owner: move the switch to "released", freeze the Fara'id
 * + Wasiyyah distribution (computed from LIVING relatives at this instant), and log
 * it. Idempotent — a second call after release is a no-op. Plain helper so it
 * composes inside the review mutation and the cron longstop (Phase 4).
 */
export async function authorizeRelease(ctx: MutationCtx, ownerId: string, actor: string) {
  const sw = await ctx.db
    .query("switchState")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .unique()
  if (sw?.state === "released") return // already released
  const now = Date.now()
  if (sw === null) {
    await ctx.db.insert("switchState", {
      ownerId,
      checkInIntervalMs: 0,
      gracePeriodMs: 0,
      state: "released",
      lastCheckInAt: now,
      nextDeadlineAt: now,
      releaseAuthorizedAt: now,
    })
  } else {
    await ctx.db.patch(sw._id, { state: "released", releaseAuthorizedAt: now })
  }

  // Freeze the distribution. Wipe any prior snapshot first (defensive; release is once).
  const prior = await ctx.db
    .query("releaseDistribution")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .take(500)
  for (const p of prior) await ctx.db.delete(p._id)

  const fam = await ctx.db
    .query("familyMembers")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .take(300)
  const owner = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", ownerId))
    .unique()
  const faraid = computeFaraid({
    deceasedGender: owner?.ownerGender ?? undefined,
    heirs: fam
      .filter((f) => f.relationship !== "other")
      .map<EngineHeir>((f) => ({
        id: f._id,
        relationship: f.relationship,
        lineage: f.lineage ?? undefined,
        gender: f.gender,
        isAlive: f.isAlive,
      })),
  })
  if (faraid.status === "ok") {
    for (const s of faraid.shares) {
      await ctx.db.insert("releaseDistribution", {
        ownerId,
        familyMemberId: s.heirId as (typeof fam)[number]["_id"],
        kind: "faraid",
        fractionNumerator: s.numerator,
        fractionDenominator: s.denominator,
      })
    }
  }
  const allocs = await ctx.db
    .query("wasiyyahAllocations")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .take(300)
  for (const a of allocs) {
    await ctx.db.insert("releaseDistribution", {
      ownerId,
      beneficiaryId: a.beneficiaryId,
      kind: "wasiyyah",
      fractionNumerator: a.percentage,
      fractionDenominator: 100,
    })
  }

  await ctx.db.insert("auditLog", { ownerId, actor, event: "release_authorized", targetTable: "switchState" })
}
