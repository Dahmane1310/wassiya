import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { type Doc } from "../_generated/dataModel"
import { query } from "../_generated/server"
import { expandOwnerId, requireAdmin } from "../lib/adminAuth"

// Global audit-log viewer with server-side filters: owner, event, owner+event
// (compound index) and a creation-time range — every branch is a real indexed
// query, newest-or-oldest first. The repetitive range chaining below is forced
// by Convex's progressive IndexRangeBuilder types (eq* → gte? → lte?).

type AuditEvent = Doc<"auditLog">["event"]

export const listAuditLog = query({
  args: {
    ownerId: v.optional(v.string()),
    event: v.optional(v.string()),
    from: v.optional(v.number()), // _creationTime range (ms)
    to: v.optional(v.number()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = args.ownerId
      ? expandOwnerId(me.tokenIdentifier, args.ownerId)
      : undefined
    const event = (args.event || undefined) as AuditEvent | undefined
    const order = args.order ?? "desc"
    const { from, to } = args

    const base =
      ownerId !== undefined && event !== undefined
        ? ctx.db.query("auditLog").withIndex("by_ownerId_and_event", (q) => {
            const eq = q.eq("ownerId", ownerId).eq("event", event)
            if (from !== undefined && to !== undefined)
              return eq.gte("_creationTime", from).lte("_creationTime", to)
            if (from !== undefined) return eq.gte("_creationTime", from)
            if (to !== undefined) return eq.lte("_creationTime", to)
            return eq
          })
        : ownerId !== undefined
          ? ctx.db.query("auditLog").withIndex("by_ownerId", (q) => {
              const eq = q.eq("ownerId", ownerId)
              if (from !== undefined && to !== undefined)
                return eq.gte("_creationTime", from).lte("_creationTime", to)
              if (from !== undefined) return eq.gte("_creationTime", from)
              if (to !== undefined) return eq.lte("_creationTime", to)
              return eq
            })
          : event !== undefined
            ? ctx.db.query("auditLog").withIndex("by_event", (q) => {
                const eq = q.eq("event", event)
                if (from !== undefined && to !== undefined)
                  return eq.gte("_creationTime", from).lte("_creationTime", to)
                if (from !== undefined) return eq.gte("_creationTime", from)
                if (to !== undefined) return eq.lte("_creationTime", to)
                return eq
              })
            : ctx.db.query("auditLog").withIndex("by_creation_time", (q) => {
                if (from !== undefined && to !== undefined)
                  return q.gte("_creationTime", from).lte("_creationTime", to)
                if (from !== undefined) return q.gte("_creationTime", from)
                if (to !== undefined) return q.lte("_creationTime", to)
                return q
              })

    const result = await base.order(order).paginate(args.paginationOpts)
    return {
      ...result,
      page: result.page.map((a) => ({
        _id: a._id,
        _creationTime: a._creationTime,
        ownerId: a.ownerId,
        actor: a.actor,
        event: a.event as string,
        targetTable: a.targetTable ?? null,
        targetId: a.targetId ?? null,
        meta: a.meta ?? null,
      })),
    }
  },
})
