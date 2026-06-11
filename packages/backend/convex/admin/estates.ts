import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { query } from "../_generated/server"
import { expandOwnerId, requireAdmin, resolveProfile } from "../lib/adminAuth"

// Release oversight. Two concerns:
// 1. SAFETY — switches in "pendingVerification" with a longstop will AUTO-RELEASE
//    when the timer fires, without any human decision. Admins must see those
//    countdowns before they happen.
// 2. DISPUTES — once released, the frozen Fara'id/Wasiyyah distribution snapshot
//    is the legal record. ZK contract: heir NAMES are encrypted and never leave
//    here — only structural roles (relationship/lineage/gender) and fractions.

export const listPendingRelease = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const result = await ctx.db
      .query("switchState")
      .withIndex("by_state_and_nextDeadlineAt", (q) =>
        q.eq("state", "pendingVerification"),
      )
      .order("asc") // oldest pending first — closest to longstop
      .paginate(args.paginationOpts)
    const page = []
    for (const sw of result.page) {
      const profile = await resolveProfile(ctx, sw.ownerId)
      const deathCase = await ctx.db
        .query("deathVerification")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", sw.ownerId))
        .unique()
      const longstopAt =
        sw.pendingVerificationStartedAt !== undefined && sw.longstopMs !== undefined
          ? sw.pendingVerificationStartedAt + sw.longstopMs
          : null
      page.push({
        ownerId: sw.ownerId,
        ownerEmail: profile?.email ?? null,
        pendingSince: sw.pendingVerificationStartedAt ?? null,
        longstopAt, // null = no auto-release; waits for a human decision
        requireDeathVerification: sw.requireDeathVerification ?? false,
        deathCaseStatus: deathCase?.status ?? null,
      })
    }
    return { ...result, page }
  },
})

export const listReleased = query({
  args: {
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const result = await ctx.db
      .query("switchState")
      .withIndex("by_state_and_nextDeadlineAt", (q) => q.eq("state", "released"))
      .order(args.order ?? "desc")
      .paginate(args.paginationOpts)
    const page = []
    for (const sw of result.page) {
      const profile = await resolveProfile(ctx, sw.ownerId)
      const distribution = await ctx.db
        .query("releaseDistribution")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", sw.ownerId))
        .take(101)
      page.push({
        ownerId: sw.ownerId,
        ownerEmail: profile?.email ?? null,
        releasedAt: sw.releaseAuthorizedAt ?? null,
        shareCount: { value: Math.min(distribution.length, 100), capped: distribution.length > 100 },
      })
    }
    return { ...result, page }
  },
})

/** The frozen distribution snapshot for one released estate. Structural data
 *  only — never heir names, labels or asset contents. */
export const getEstateDetail = query({
  args: { ownerId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      ownerId: v.string(),
      ownerEmail: v.union(v.string(), v.null()),
      releasedAt: v.union(v.number(), v.null()),
      deathCase: v.union(
        v.null(),
        v.object({
          status: v.string(),
          reviewedBy: v.union(v.string(), v.null()),
          reviewedAt: v.union(v.number(), v.null()),
          hasCertificate: v.boolean(),
        }),
      ),
      shares: v.array(
        v.object({
          kind: v.union(v.literal("faraid"), v.literal("wasiyyah")),
          // faraid: structural heir role; wasiyyah: recipient email.
          heir: v.union(
            v.object({
              type: v.literal("familyMember"),
              relationship: v.string(),
              lineage: v.union(v.string(), v.null()),
              gender: v.string(),
            }),
            v.object({ type: v.literal("beneficiary"), contactEmail: v.string() }),
            v.object({ type: v.literal("unknown") }),
          ),
          fractionNumerator: v.number(),
          fractionDenominator: v.number(),
          percent: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (sw === null || sw.state !== "released") return null

    const profile = await resolveProfile(ctx, ownerId)
    const deathCase = await ctx.db
      .query("deathVerification")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    const rows = await ctx.db
      .query("releaseDistribution")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(200)

    const shares = []
    for (const r of rows) {
      let heir:
        | { type: "familyMember"; relationship: string; lineage: string | null; gender: string }
        | { type: "beneficiary"; contactEmail: string }
        | { type: "unknown" } = { type: "unknown" }
      if (r.familyMemberId !== undefined) {
        const fm = await ctx.db.get(r.familyMemberId)
        if (fm !== null) {
          heir = {
            type: "familyMember",
            relationship: fm.relationship,
            lineage: fm.lineage ?? null,
            gender: fm.gender,
          }
        }
      } else if (r.beneficiaryId !== undefined) {
        const b = await ctx.db.get(r.beneficiaryId)
        if (b !== null) heir = { type: "beneficiary", contactEmail: b.contactEmail }
      }
      shares.push({
        kind: r.kind,
        heir,
        fractionNumerator: r.fractionNumerator,
        fractionDenominator: r.fractionDenominator,
        percent:
          r.fractionDenominator === 0
            ? 0
            : (r.fractionNumerator / r.fractionDenominator) * 100,
      })
    }

    return {
      ownerId,
      ownerEmail: profile?.email ?? null,
      releasedAt: sw.releaseAuthorizedAt ?? null,
      deathCase:
        deathCase === null
          ? null
          : {
              status: deathCase.status,
              reviewedBy: deathCase.reviewedBy ?? null,
              reviewedAt: deathCase.reviewedAt ?? null,
              hasCertificate: deathCase.certificateStorageId != null,
            },
      shares,
    }
  },
})
