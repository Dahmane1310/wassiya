import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { query } from "../_generated/server"
import { expandOwnerId, requireAdmin, resolveProfile } from "../lib/adminAuth"

// Billing ledger (append-only billingEvents): refund/dispute support. Indexed
// by owner; the global view is the whole table newest-first. `source` has no
// index — the page filters it client-side over loaded rows (documented there).

export const listBillingEvents = query({
  args: {
    ownerId: v.optional(v.string()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId =
      args.ownerId && args.ownerId.trim() !== ""
        ? expandOwnerId(me.tokenIdentifier, args.ownerId)
        : undefined
    const order = args.order ?? "desc"
    const result =
      ownerId !== undefined
        ? await ctx.db
            .query("billingEvents")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
            .order(order)
            .paginate(args.paginationOpts)
        : await ctx.db.query("billingEvents").order(order).paginate(args.paginationOpts)
    const page = []
    for (const e of result.page) {
      const profile = e.ownerId ? await resolveProfile(ctx, e.ownerId) : null
      page.push({
        _id: e._id,
        _creationTime: e._creationTime,
        ownerId: e.ownerId ?? null,
        ownerEmail: profile?.email ?? null,
        source: e.source,
        type: e.type,
        plan: e.plan ?? null,
        externalEventId: e.externalEventId ?? null,
        meta: e.meta ?? null,
      })
    }
    return { ...result, page }
  },
})
