import { v } from "convex/values"
import { mutation } from "./_generated/server"

// Single-use enrollment tokens for beneficiary / executor account linking. Only a
// HASH of the token is ever stored — the raw token is generated on the OWNER's
// device, shared out-of-band, and never reaches the server (schema `invites`).

/**
 * Issue an invite for one of the owner's beneficiaries/executors. The client
 * generated the random token + its sha256; we store only the hash.
 */
export const issueInvite = mutation({
  args: {
    kind: v.union(v.literal("beneficiary"), v.literal("executor")),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    executorId: v.optional(v.id("executors")),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier

    // Ownership-check the target, and capture its id for the audit log.
    let targetId: string
    if (args.kind === "beneficiary") {
      if (!args.beneficiaryId) throw new Error("beneficiaryId required")
      const b = await ctx.db.get(args.beneficiaryId)
      if (b === null || b.ownerId !== ownerId) throw new Error("Not found")
      targetId = args.beneficiaryId
    } else {
      if (!args.executorId) throw new Error("executorId required")
      const e = await ctx.db.get(args.executorId)
      if (e === null || e.ownerId !== ownerId) throw new Error("Not found")
      targetId = args.executorId
    }

    await ctx.db.insert("invites", {
      ownerId,
      kind: args.kind,
      beneficiaryId: args.beneficiaryId,
      executorId: args.executorId,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    })
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: ownerId,
      event: args.kind === "beneficiary" ? "beneficiary_invited" : "executor_invited",
      targetTable: args.kind === "beneficiary" ? "beneficiaries" : "executors",
      targetId,
    })
  },
})

/**
 * Redeem an invite: the recipient's signed-in account is linked to the
 * beneficiary/executor. (Keypair ENROLLMENT — uploading a public key — is a
 * separate, later step; this only links the account + consumes the token.)
 */
export const redeemInvite = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique()
    if (invite === null) throw new Error("Invalid invite")
    if (invite.consumedAt != null) throw new Error("This invite has already been used")
    if (invite.expiresAt < Date.now()) throw new Error("This invite has expired")

    // Link the account only. `status: "enrolled"` is reserved for when they upload
    // a public key (keypair enrollment — a later slice), so it stays "invited" here.
    if (invite.kind === "beneficiary" && invite.beneficiaryId) {
      await ctx.db.patch(invite.beneficiaryId, { linkedUserId: identity.tokenIdentifier })
    } else if (invite.kind === "executor" && invite.executorId) {
      await ctx.db.patch(invite.executorId, { linkedUserId: identity.tokenIdentifier })
    }
    await ctx.db.patch(invite._id, { consumedAt: Date.now() })
    await ctx.db.insert("auditLog", {
      ownerId: invite.ownerId,
      actor: identity.tokenIdentifier,
      event: invite.kind === "beneficiary" ? "beneficiary_enrolled" : "executor_invited",
      targetTable: invite.kind === "beneficiary" ? "beneficiaries" : "executors",
      targetId: (invite.beneficiaryId ?? invite.executorId) as string,
    })
    return { kind: invite.kind }
  },
})
