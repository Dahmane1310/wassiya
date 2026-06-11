import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { applyGrant } from "../entitlements"
import {
  expandOwnerId,
  logAdminAction,
  requireAdmin,
  resolveProfile,
} from "../lib/adminAuth"

// Admin entitlement management: browse, manually grant (support comps / trial
// extensions) and revoke. Every change writes a billing-ledger row AND an audit
// entry with the admin actor.

const DAY_MS = 24 * 60 * 60 * 1000

export const listEntitlements = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("trialing"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("expired"),
      ),
    ),
    plan: v.optional(
      v.union(v.literal("trial"), v.literal("annual"), v.literal("lifetime")),
    ),
    ownerId: v.optional(v.string()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const { status, plan } = args
    const ownerId =
      args.ownerId && args.ownerId.trim() !== ""
        ? expandOwnerId(me.tokenIdentifier, args.ownerId)
        : undefined
    const order = args.order ?? "desc"
    // Every filter combination maps onto a real index — never a table scan + filter.
    const base =
      ownerId !== undefined && ownerId !== ""
        ? ctx.db
            .query("entitlements")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        : status !== undefined && plan !== undefined
          ? ctx.db
              .query("entitlements")
              .withIndex("by_status_and_plan", (q) =>
                q.eq("status", status).eq("plan", plan),
              )
          : status !== undefined
            ? ctx.db
                .query("entitlements")
                .withIndex("by_status_and_currentPeriodEnd", (q) =>
                  q.eq("status", status),
                )
            : plan !== undefined
              ? ctx.db
                  .query("entitlements")
                  .withIndex("by_plan", (q) => q.eq("plan", plan))
              : ctx.db.query("entitlements")
    const result = await base.order(order).paginate(args.paginationOpts)
    const page = []
    for (const e of result.page) {
      const profile = await resolveProfile(ctx, e.ownerId)
      page.push({
        _id: e._id,
        _creationTime: e._creationTime,
        ownerId: e.ownerId,
        email: profile?.email ?? null,
        plan: e.plan,
        status: e.status,
        source: e.source,
        currentPeriodEnd: e.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: e.cancelAtPeriodEnd ?? false,
      })
    }
    return { ...result, page }
  },
})

/** Manual grant: comp a paid plan or extend a trial. */
export const adminGrantEntitlement = mutation({
  args: {
    ownerId: v.string(),
    grant: v.union(
      v.object({ kind: v.literal("trial_extension"), days: v.number() }),
      v.object({
        kind: v.literal("annual"),
        currentPeriodEnd: v.optional(v.number()),
      }),
      v.object({ kind: v.literal("lifetime") }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const now = Date.now()

    if (args.grant.kind === "trial_extension") {
      const days = Math.floor(args.grant.days)
      if (days < 1 || days > 365) throw new ConvexError("INVALID_DAYS")
      const existing = await ctx.db
        .query("entitlements")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
        .unique()
      // Extend from the later of (current period end, now) so a lapsed trial
      // restarts from today rather than producing an already-expired date.
      const anchor = Math.max(existing?.currentPeriodEnd ?? now, now)
      const fields = {
        plan: "trial" as const,
        status: "trialing" as const,
        source: "trial" as const,
        currentPeriodEnd: anchor + days * DAY_MS,
        cancelAtPeriodEnd: false,
      }
      if (existing !== null) await ctx.db.patch(existing._id, fields)
      else await ctx.db.insert("entitlements", { ownerId, ...fields })
      await ctx.db.insert("billingEvents", {
        ownerId,
        source: "manual",
        type: "manual_grant",
        plan: "trial",
        meta: { days: String(days) },
      })
    } else if (args.grant.kind === "annual") {
      await applyGrant(ctx, {
        ownerId,
        plan: "annual",
        source: "manual",
        currentPeriodEnd: args.grant.currentPeriodEnd ?? now + 365 * DAY_MS,
        eventType: "manual_grant",
      })
    } else {
      await applyGrant(ctx, {
        ownerId,
        plan: "lifetime",
        source: "manual",
        eventType: "manual_grant",
      })
    }

    await logAdminAction(ctx, {
      ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "entitlement_granted",
      targetTable: "entitlements",
      meta: { kind: args.grant.kind },
    })
    return null
  },
})

/** Revoke an owner's entitlement (support action — e.g. refund, abuse). */
export const adminRevokeEntitlement = mutation({
  args: {
    ownerId: v.string(),
    status: v.union(v.literal("canceled"), v.literal("expired")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const row = await ctx.db
      .query("entitlements")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (row === null) throw new ConvexError("NOT_FOUND")
    await ctx.db.patch(row._id, { status: args.status })
    await ctx.db.insert("billingEvents", {
      ownerId,
      source: "manual",
      type: args.status,
      plan: row.plan,
    })
    await logAdminAction(ctx, {
      ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "entitlement_revoked",
      targetTable: "entitlements",
      targetId: row._id,
      meta: { status: args.status },
    })
    return null
  },
})
