import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { authKit } from "./auth"
import { requireEnabledUser } from "./lib/account"

// Single-use enrollment tokens for beneficiary account linking. Only a HASH of the
// token is ever stored — the raw token is generated on the OWNER's device, shared
// out-of-band, and never reaches the server (schema `invites`). Executors were
// removed, so every invite is for a beneficiary.

/**
 * Issue an invite for one of the owner's beneficiaries. The client generated the
 * random token + its sha256; we store only the hash.
 */
export const issueInvite = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const ownerId = identity.tokenIdentifier

    const beneficiary = await ctx.db.get(args.beneficiaryId)
    if (beneficiary === null || beneficiary.ownerId !== ownerId) {
      throw new Error("Not found")
    }

    // Capture the owner's display name (server-side, from their own WorkOS profile) so
    // the beneficiary can see WHO named them on the web portal. Owner-consented.
    const owner = await authKit.getAuthUser(ctx)
    const ownerName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim()
    if (ownerName) {
      await ctx.db.patch(args.beneficiaryId, { ownerName })
    }

    await ctx.db.insert("invites", {
      ownerId,
      kind: "beneficiary",
      beneficiaryId: args.beneficiaryId,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    })
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: ownerId,
      event: "beneficiary_invited",
      targetTable: "beneficiaries",
      targetId: args.beneficiaryId,
    })
  },
})

/**
 * Redeem an invite: the recipient's signed-in account is linked to the beneficiary.
 * (Keypair ENROLLMENT — uploading a public key — is a separate, later step; this
 * only links the account + consumes the token.)
 */
export const redeemInvite = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique()
    if (invite === null) throw new Error("Invalid invite")
    if (invite.consumedAt != null) throw new Error("This invite has already been used")
    if (invite.expiresAt < Date.now()) throw new Error("This invite has expired")

    if (invite.beneficiaryId) {
      // If this user already enrolled a release keypair (named by another owner),
      // the newly-linked beneficiary is immediately releasable → mark it enrolled
      // so the owner's reconciliation wraps to the existing key. Otherwise it stays
      // "invited" until the user enrolls.
      const recipientKey = await ctx.db
        .query("recipientKeys")
        .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
        .unique()
      await ctx.db.patch(invite.beneficiaryId, {
        linkedUserId: identity.tokenIdentifier,
        ...(recipientKey !== null ? { status: "enrolled" as const } : {}),
      })
    }
    await ctx.db.patch(invite._id, { consumedAt: Date.now() })
    await ctx.db.insert("auditLog", {
      ownerId: invite.ownerId,
      actor: identity.tokenIdentifier,
      event: "beneficiary_enrolled",
      targetTable: "beneficiaries",
      targetId: invite.beneficiaryId as string,
    })
    return { kind: invite.kind }
  },
})
