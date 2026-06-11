import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { logAdminAction, requireAdmin, resolveProfile } from "../lib/adminAuth"

// Death-verification case management beyond the basic queue: full status-filtered
// history and the re-open support action. The decision itself stays in
// `release.reviewDeathVerification` (one-shot: throws ALREADY_REVIEWED on a
// decided case, requires notes on reject).

export const listCases = query({
  args: {
    status: v.union(
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const result = await ctx.db
      .query("deathVerification")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order(args.order ?? "desc")
      .paginate(args.paginationOpts)
    const page = []
    for (const r of result.page) {
      const sw = await ctx.db
        .query("switchState")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", r.ownerId))
        .unique()
      const profile = await resolveProfile(ctx, r.ownerId)
      page.push({
        _id: r._id,
        _creationTime: r._creationTime,
        ownerId: r.ownerId,
        ownerEmail: profile?.email ?? null,
        status: r.status,
        submittedAt: r.submittedAt ?? r._creationTime,
        dateOfDeath: r.dateOfDeath ?? null,
        submitterRole: r.submitterRole ?? null,
        submittedByKind: r.submittedByKind ?? null,
        submittedByEmail: r.submittedByEmail ?? null,
        hasCertificate: r.certificateStorageId != null,
        reviewedBy: r.reviewedBy ?? null,
        reviewedAt: r.reviewedAt ?? null,
        reviewNotes: r.reviewNotes ?? null,
        switchState: sw?.state ?? null,
        // The alive signal a reviewer must not miss: the owner's last check-in,
        // compared against submittedAt in the UI.
        lastCheckInAt: sw?.lastCheckInAt ?? null,
      })
    }
    return { ...result, page }
  },
})

/** One case, fully enriched — backs the dedicated /review/[id] page. */
export const getCase = query({
  args: { id: v.id("deathVerification") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const r = await ctx.db.get(args.id)
    if (r === null) return null
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", r.ownerId))
      .unique()
    const profile = await resolveProfile(ctx, r.ownerId)
    return {
      _id: r._id,
      _creationTime: r._creationTime,
      ownerId: r.ownerId,
      ownerEmail: profile?.email ?? null,
      status: r.status,
      submittedAt: r.submittedAt ?? r._creationTime,
      dateOfDeath: r.dateOfDeath ?? null,
      submitterRole: r.submitterRole ?? null,
      submittedByKind: r.submittedByKind ?? null,
      submittedByEmail: r.submittedByEmail ?? null,
      hasCertificate: r.certificateStorageId != null,
      reviewedBy: r.reviewedBy ?? null,
      reviewedAt: r.reviewedAt ?? null,
      reviewNotes: r.reviewNotes ?? null,
      switchState: sw?.state ?? null,
      lastCheckInAt: sw?.lastCheckInAt ?? null,
    }
  },
})

/** Move a decided case back to review. Blocked once the estate is released —
 *  release froze the distribution and beneficiaries may already have decrypted. */
export const reopenDeathCase = mutation({
  args: { id: v.id("deathVerification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const row = await ctx.db.get(args.id)
    if (row === null) throw new ConvexError("NOT_FOUND")
    if (row.status !== "approved" && row.status !== "rejected") {
      throw new ConvexError("INVALID_STATE")
    }
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", row.ownerId))
      .unique()
    if (sw?.state === "released") throw new ConvexError("ALREADY_RELEASED")
    const previousStatus = row.status
    await ctx.db.patch(args.id, {
      status: "under_review",
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewNotes: undefined,
    })
    await logAdminAction(ctx, {
      ownerId: row.ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "death_review_reopened",
      targetTable: "deathVerification",
      targetId: args.id,
      meta: { previousStatus },
    })
    return null
  },
})
