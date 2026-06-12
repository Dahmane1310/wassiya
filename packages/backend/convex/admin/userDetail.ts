import { v } from "convex/values"
import { query, type QueryCtx } from "../_generated/server"
import { expandOwnerId, requireAdmin, resolveProfile } from "../lib/adminAuth"
import { loadEntitlement } from "../lib/entitlements"

// One owner's full support view. ZERO-KNOWLEDGE CONTRACT: this query never selects
// asset payloads, beneficiary labels, family-member names, wasiyyah notes, or any
// key material — structure, states, timestamps and counts only.

const CAP = 500
const countShape = v.object({ value: v.number(), capped: v.boolean() })

async function countByOwner(
  ctx: QueryCtx,
  table: "assets" | "familyMembers",
  ownerId: string,
): Promise<{ value: number; capped: boolean }> {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
    .take(CAP + 1)
  return { value: Math.min(rows.length, CAP), capped: rows.length > CAP }
}

export const getUserDetail = query({
  args: { tokenIdentifier: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      identity: v.object({
        tokenIdentifier: v.string(),
        email: v.union(v.string(), v.null()),
        name: v.union(v.string(), v.null()),
        createdAt: v.union(v.string(), v.null()),
        lastSignInAt: v.union(v.string(), v.null()),
      }),
      appUser: v.union(
        v.null(),
        v.object({
          onboardingComplete: v.boolean(),
          ownerGender: v.union(v.string(), v.null()),
          createdAt: v.number(),
        }),
      ),
      switch: v.union(
        v.null(),
        v.object({
          state: v.string(),
          checkInIntervalMs: v.number(),
          gracePeriodMs: v.number(),
          lastCheckInAt: v.number(),
          nextDeadlineAt: v.number(),
          graceStartedAt: v.union(v.number(), v.null()),
          pendingVerificationStartedAt: v.union(v.number(), v.null()),
          releaseAuthorizedAt: v.union(v.number(), v.null()),
          checkInStreak: v.number(),
          requireDeathVerification: v.boolean(),
          longstopMs: v.union(v.number(), v.null()),
        }),
      ),
      entitlement: v.object({
        plan: v.string(),
        status: v.string(),
        currentPeriodEnd: v.union(v.number(), v.null()),
        cancelAtPeriodEnd: v.boolean(),
        persisted: v.boolean(),
      }),
      counts: v.object({
        assets: countShape,
        familyMembers: countShape,
        wasiyyahTotalPct: v.number(),
      }),
      beneficiaries: v.array(
        v.object({
          _id: v.id("beneficiaries"),
          contactEmail: v.string(),
          status: v.string(),
          linked: v.boolean(),
          // Latest invite token's raw timestamps; the CLIENT derives
          // pending/expired/used (queries must not read wall-clock).
          invite: v.union(
            v.null(),
            v.object({
              expiresAt: v.number(),
              consumedAt: v.union(v.number(), v.null()),
            }),
          ),
        }),
      ),
      deathCase: v.union(
        v.null(),
        v.object({
          _id: v.id("deathVerification"),
          status: v.string(),
          submittedByEmail: v.union(v.string(), v.null()),
          reviewedBy: v.union(v.string(), v.null()),
          reviewedAt: v.union(v.number(), v.null()),
          reviewNotes: v.union(v.string(), v.null()),
          hasCertificate: v.boolean(),
        }),
      ),
      recentAudit: v.array(
        v.object({
          _id: v.id("auditLog"),
          _creationTime: v.number(),
          actor: v.string(),
          event: v.string(),
          targetTable: v.union(v.string(), v.null()),
          meta: v.union(v.record(v.string(), v.string()), v.null()),
        }),
      ),
      // Support-disable marker (lib/account.ts wall). null = account enabled.
      disabled: v.union(
        v.null(),
        v.object({
          disabledAt: v.number(),
          disabledBy: v.string(),
          reason: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    // Accepts a full tokenIdentifier OR a bare WorkOS subject (URL-friendly).
    const ownerId = expandOwnerId(me.tokenIdentifier, args.tokenIdentifier)
    const profile = await resolveProfile(ctx, ownerId)
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", ownerId))
      .unique()
    // Admin-provisioned account: the synced profile may lag the WorkOS webhook,
    // so fall back to the creation-time snapshot rather than "not found".
    const provisioned =
      profile === null
        ? await ctx.db
            .query("provisionedAccounts")
            .withIndex("by_accountId", (q) => q.eq("accountId", ownerId))
            .unique()
        : null
    if (profile === null && appUser === null && provisioned === null) return null

    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    const ent = await loadEntitlement(ctx, ownerId)
    const wasiyyah = await ctx.db
      .query("wasiyyahAllocations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(300)
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(50)
    const deathCase = await ctx.db
      .query("deathVerification")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    const recentAudit = await ctx.db
      .query("auditLog")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(20)
    const disabledRow = await ctx.db
      .query("disabledAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", ownerId))
      .unique()

    return {
      identity: {
        tokenIdentifier: ownerId,
        email: profile?.email ?? provisioned?.email ?? null,
        name: profile?.name ?? provisioned?.name ?? null,
        createdAt: profile?.createdAt ?? null,
        lastSignInAt: profile?.lastSignInAt ?? null,
      },
      appUser:
        appUser === null
          ? null
          : {
              onboardingComplete: appUser.onboardingComplete ?? false,
              ownerGender: appUser.ownerGender ?? null,
              createdAt: appUser._creationTime,
            },
      switch:
        sw === null
          ? null
          : {
              state: sw.state,
              checkInIntervalMs: sw.checkInIntervalMs,
              gracePeriodMs: sw.gracePeriodMs,
              lastCheckInAt: sw.lastCheckInAt,
              nextDeadlineAt: sw.nextDeadlineAt,
              graceStartedAt: sw.graceStartedAt ?? null,
              pendingVerificationStartedAt: sw.pendingVerificationStartedAt ?? null,
              releaseAuthorizedAt: sw.releaseAuthorizedAt ?? null,
              checkInStreak: sw.checkInStreak ?? 0,
              requireDeathVerification: sw.requireDeathVerification ?? false,
              longstopMs: sw.longstopMs ?? null,
            },
      entitlement: {
        plan: ent.plan,
        status: ent.status,
        currentPeriodEnd: ent.currentPeriodEnd,
        cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
        persisted: ent.persisted,
      },
      counts: {
        assets: await countByOwner(ctx, "assets", ownerId),
        familyMembers: await countByOwner(ctx, "familyMembers", ownerId),
        wasiyyahTotalPct: wasiyyah.reduce((sum, a) => sum + a.percentage, 0),
      },
      beneficiaries: await Promise.all(
        beneficiaries.map(async (b) => {
          const invite = await ctx.db
            .query("invites")
            .withIndex("by_beneficiaryId", (q) => q.eq("beneficiaryId", b._id))
            .order("desc")
            .first()
          return {
            _id: b._id,
            contactEmail: b.contactEmail,
            status: b.status,
            linked: b.linkedUserId !== undefined,
            invite:
              invite === null
                ? null
                : { expiresAt: invite.expiresAt, consumedAt: invite.consumedAt ?? null },
          }
        }),
      ),
      deathCase:
        deathCase === null
          ? null
          : {
              _id: deathCase._id,
              status: deathCase.status,
              submittedByEmail: deathCase.submittedByEmail ?? null,
              reviewedBy: deathCase.reviewedBy ?? null,
              reviewedAt: deathCase.reviewedAt ?? null,
              reviewNotes: deathCase.reviewNotes ?? null,
              hasCertificate: deathCase.certificateStorageId != null,
            },
      recentAudit: recentAudit.map((a) => ({
        _id: a._id,
        _creationTime: a._creationTime,
        actor: a.actor,
        event: a.event,
        targetTable: a.targetTable ?? null,
        meta: a.meta ?? null,
      })),
      disabled:
        disabledRow === null
          ? null
          : {
              disabledAt: disabledRow._creationTime,
              disabledBy: disabledRow.disabledBy,
              reason: disabledRow.reason ?? null,
            },
    }
  },
})
