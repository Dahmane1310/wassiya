import { v } from "convex/values"
import { query } from "./_generated/server"
import { getEnabledUser } from "./lib/account"

// Read side of the append-only `auditLog` (written by assets / invites / switch).
// Owner-scoped via `getUserIdentity()` — never a client-passed id — and bounded,
// so the home-screen activity feed stays cheap as the log grows. The log holds
// event types + ids only (never plaintext), so this is safe to surface verbatim;
// the client maps each `event` to an icon/label.

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export const listActivity = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("auditLog"),
      _creationTime: v.number(),
      event: v.string(),
      actor: v.string(),
      targetTable: v.optional(v.string()),
      targetId: v.optional(v.string()),
      meta: v.optional(v.record(v.string(), v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await getEnabledUser(ctx)
    if (identity === null) {
      return []
    }
    const limit = Math.min(Math.max(args.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .order("desc")
      .take(limit)
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      event: r.event,
      actor: r.actor,
      targetTable: r.targetTable,
      targetId: r.targetId,
      meta: r.meta,
    }))
  },
})
