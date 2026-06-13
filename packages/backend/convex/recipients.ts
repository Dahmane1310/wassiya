import { v } from "convex/values"
import { computeFaraid, type Heir as EngineHeir } from "@workspace/faraid"
import { internal } from "./_generated/api"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { type Doc } from "./_generated/dataModel"
import { getEnabledUser, isAccountDisabled, requireEnabledUser } from "./lib/account"

// A beneficiary-user's release keypair — one per person (`userId` = WorkOS
// tokenIdentifier). The PRIVATE half is recovery-wrapped client-side before it
// arrives here, so the server stores only ciphertext + the public key. Enrollment
// is WRITE-ONCE: overwriting the public key would orphan every DEK already wrapped
// to the old one. The narrow exception is `rotateKeypair` (beneficiary-driven,
// lost recovery code): it replaces the keypair ONLY while every benefactor is
// reachable, then deletes the old wraps so owners' apps silently re-wrap.

/** Whether the current user has enrolled a release keypair (+ its fingerprint for
 *  display). Drives the web enrollment page (skip if already enrolled). This is the
 *  portal GATE query: it carries the explicit `disabled` flag (support-disabled
 *  account) instead of throwing — the portal shows a disabled state; every other
 *  function rejects via lib/account.ts. */
export const getMyRecipientStatus = query({
  args: {},
  returns: v.object({
    enrolled: v.boolean(),
    keyFingerprint: v.union(v.string(), v.null()),
    disabled: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return { enrolled: false, keyFingerprint: null, disabled: false }
    }
    if (await isAccountDisabled(ctx, identity.tokenIdentifier)) {
      return { enrolled: false, keyFingerprint: null, disabled: true }
    }
    const row = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique()
    return {
      enrolled: row !== null,
      keyFingerprint: row?.keyFingerprint ?? null,
      disabled: false,
    }
  },
})

/**
 * The owners who named the current user as a beneficiary — the web portal's "People
 * who named you". One person (recipient keypair) can be named by many owners. For
 * each, returns the owner's display name, their switch status, the beneficiary's role
 * + relationship + legal share (live Fara'id pre-release, frozen `releaseDistribution`
 * after), and how many items are reserved. Asset CONTENTS stay sealed until release —
 * only name/relation/share are surfaced (per the product decision). All structural
 * inputs (family tree) are plaintext by design, so no ciphertext is exposed.
 */
export const listMyBenefactors = query({
  args: {},
  returns: v.array(
    v.object({
      beneficiaryId: v.id("beneficiaries"),
      ownerId: v.string(),
      ownerName: v.string(),
      status: v.union(
        v.literal("active"),
        v.literal("grace"),
        v.literal("pending"),
        v.literal("released"),
      ),
      role: v.union(v.literal("heir"), v.literal("recipient")),
      relationship: v.union(v.string(), v.null()),
      shareLabel: v.union(v.string(), v.null()),
      nextDeadlineAt: v.union(v.number(), v.null()),
      graceStartedAt: v.union(v.number(), v.null()),
      gracePeriodMs: v.union(v.number(), v.null()),
      releaseAuthorizedAt: v.union(v.number(), v.null()),
      itemCount: v.number(),
      // The owner's death-report case, if any. `rejectedReason` is the
      // reviewer's note — only exposed when the report was rejected, so the
      // submitter knows what to fix before sending a corrected one.
      deathCase: v.union(
        v.null(),
        v.object({
          status: v.string(),
          rejectedReason: v.union(v.string(), v.null()),
          submittedAt: v.union(v.number(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const identity = await getEnabledUser(ctx)
    if (identity === null) return []
    const me = identity.tokenIdentifier
    const rows = await ctx.db
      .query("beneficiaries")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", me))
      .take(100)

    const out: Array<{
      beneficiaryId: (typeof rows)[number]["_id"]
      ownerId: string
      ownerName: string
      status: "active" | "grace" | "pending" | "released"
      role: "heir" | "recipient"
      relationship: string | null
      shareLabel: string | null
      nextDeadlineAt: number | null
      graceStartedAt: number | null
      gracePeriodMs: number | null
      releaseAuthorizedAt: number | null
      itemCount: number
      deathCase: {
        status: string
        rejectedReason: string | null
        submittedAt: number | null
      } | null
    }> = []

    for (const b of rows) {
      const ownerId = b.ownerId
      const sw = await ctx.db
        .query("switchState")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        .unique()
      const raw = sw?.state ?? "active"
      const status =
        raw === "grace" ? "grace" : raw === "pendingVerification" ? "pending" : raw === "released" ? "released" : "active"

      const fam = await ctx.db
        .query("familyMembers")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        .take(200)
      const myHeir = fam.find((f) => f.linkedBeneficiaryId === b._id) ?? null
      const role: "heir" | "recipient" = myHeir ? "heir" : "recipient"

      let shareLabel: string | null = null
      if (status === "released") {
        const dist = await ctx.db
          .query("releaseDistribution")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
          .take(300)
        const mine = dist.find(
          (d) => (myHeir && d.familyMemberId === myHeir._id) || d.beneficiaryId === b._id,
        )
        if (mine) shareLabel = `${mine.fractionNumerator}/${mine.fractionDenominator}`
      } else if (myHeir) {
        const owner = await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", ownerId))
          .unique()
        const res = computeFaraid({
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
        if (res.status === "ok") {
          const s = res.shares.find((x) => x.heirId === myHeir._id)
          if (s) shareLabel = `${s.numerator}/${s.denominator}`
        }
      } else {
        const alloc = await ctx.db
          .query("wasiyyahAllocations")
          .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", b._id))
          .first()
        if (alloc) shareLabel = `${alloc.percentage}% bequest`
      }

      const wraps = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", b._id))
        .take(500)

      const dv = await ctx.db
        .query("deathVerification")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        .unique()

      out.push({
        beneficiaryId: b._id,
        ownerId,
        ownerName: b.ownerName ?? "Someone",
        status,
        role,
        relationship: myHeir?.relationship ?? null,
        shareLabel,
        nextDeadlineAt: sw?.nextDeadlineAt ?? null,
        graceStartedAt: sw?.graceStartedAt ?? null,
        gracePeriodMs: sw?.gracePeriodMs ?? null,
        releaseAuthorizedAt: sw?.releaseAuthorizedAt ?? null,
        itemCount: wraps.length,
        deathCase:
          dv === null
            ? null
            : {
                status: dv.status,
                rejectedReason:
                  dv.status === "rejected" ? (dv.reviewNotes ?? null) : null,
                submittedAt: dv.submittedAt ?? dv._creationTime,
              },
      })
    }
    return out
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
    const identity = await requireEnabledUser(ctx)
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

// ── Key rotation (lost recovery code) ────────────────────────────────────────

const ROTATE_DELETE_BUDGET = 800 // wraps deleted per transaction (well under limits)

/** Rotation is only safe while every owner who named this person is EXPECTED to
 *  open their app again — the re-wrap of asset keys depends on it. `released`
 *  is permanent (the owner can never re-wrap); `grace`/`pendingVerification`
 *  and an open/approved death case mean they may never return. `paused` is a
 *  deliberate action by a living owner, so it's allowed. */
async function assertRotationAllowed(
  ctx: MutationCtx,
  linked: Doc<"beneficiaries">[],
): Promise<void> {
  for (const b of linked) {
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", b.ownerId))
      .unique()
    if (sw?.state === "released") throw new Error("ROTATION_BLOCKED_RELEASED")
    if (sw?.state === "grace" || sw?.state === "pendingVerification") {
      throw new Error("ROTATION_BLOCKED_OWNER_UNREACHABLE")
    }
    const dv = await ctx.db
      .query("deathVerification")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", b.ownerId))
      .unique()
    if (dv?.status === "under_review" || dv?.status === "approved") {
      throw new Error("ROTATION_BLOCKED_OWNER_UNREACHABLE")
    }
  }
}

/**
 * Replace the current user's release keypair with a freshly generated one (the
 * client lost the recovery code). Same envelope shape as `enrollKeypair`. The
 * old wraps are deleted (budgeted here + a scheduled sweep) so every owner's
 * reconciliation pass resurfaces the (asset, beneficiary) pairs and re-wraps
 * to the NEW public key on their next unlock. Serializable with release
 * approval: approval first → this retries and the guard throws; this first →
 * no approvable case existed, so the unreachable window is days-scale and is
 * disclosed in the wizard copy.
 */
export const rotateKeypair = mutation({
  args: {
    publicKey: v.string(),
    keyFingerprint: v.string(),
    recoverySalt: v.string(),
    wrappedPrivateKey: v.string(),
    wrappedPrivateKeyIv: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const userId = identity.tokenIdentifier

    const existing = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
    if (existing === null) throw new Error("NOT_ENROLLED")

    const linked = await ctx.db
      .query("beneficiaries")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", userId))
      .take(200)
    await assertRotationAllowed(ctx, linked)

    const oldFingerprint = existing.keyFingerprint
    // Patch in place: the write-once check in enrollKeypair keys off row
    // EXISTENCE, so this doesn't re-arm enrollment.
    await ctx.db.patch(existing._id, {
      publicKey: args.publicKey,
      keyFingerprint: args.keyFingerprint,
      recoverySalt: args.recoverySalt,
      wrappedPrivateKey: args.wrappedPrivateKey,
      wrappedPrivateKeyIv: args.wrappedPrivateKeyIv,
    })

    // Delete stale wraps within budget; the scheduled sweep finishes the rest.
    // Filtering on the OLD-vs-new fingerprint makes deletion idempotent and
    // safe against owners inserting NEW wraps concurrently.
    let budget = ROTATE_DELETE_BUDGET
    for (const b of linked) {
      if (budget <= 0) break
      const wraps = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", b._id))
        .take(budget)
      for (const w of wraps) {
        if (w.keyFingerprint !== args.keyFingerprint) {
          await ctx.db.delete(w._id)
          budget--
        }
      }
    }
    // Always schedule the sweep — it self-terminates when nothing stale is left.
    await ctx.scheduler.runAfter(0, internal.recipients.purgeStaleWraps, { userId })

    for (const b of linked) {
      await ctx.db.insert("auditLog", {
        ownerId: b.ownerId,
        actor: userId,
        event: "recipient_key_rotated",
        targetTable: "recipientKeys",
        // Fingerprints are SHA-256 of PUBLIC keys — non-secret by design.
        meta: { oldFingerprint, newFingerprint: args.keyFingerprint },
      })
    }
    return null
  },
})

/** Budgeted sweep of wraps made under a PREVIOUS key. Re-reads the live
 *  fingerprint so a continuation from an older rotation can never delete a
 *  newer rotation's wraps. Reschedules itself while a full batch was deleted. */
export const purgeStaleWraps = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("recipientKeys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()
    if (key === null) return null
    const current = key.keyFingerprint

    const linked = await ctx.db
      .query("beneficiaries")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", args.userId))
      .take(200)

    let deleted = 0
    for (const b of linked) {
      if (deleted >= ROTATE_DELETE_BUDGET) break
      const wraps = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", b._id))
        .take(ROTATE_DELETE_BUDGET)
      for (const w of wraps) {
        if (deleted >= ROTATE_DELETE_BUDGET) break
        if (w.keyFingerprint !== current) {
          await ctx.db.delete(w._id)
          deleted++
        }
      }
    }
    if (deleted >= ROTATE_DELETE_BUDGET) {
      await ctx.scheduler.runAfter(0, internal.recipients.purgeStaleWraps, {
        userId: args.userId,
      })
    }
    return null
  },
})
