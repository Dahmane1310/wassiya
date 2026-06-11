import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/adminAuth"

// Notification outbox: server-side filters (status, kind, status+kind, exact
// recipient-email) over real indexed queries, plus the admin retry action.
// Sending itself lives in notificationSender.ts (cron-drained Resend).

const kindUnion = v.union(
  v.literal("beneficiary_invite"),
  v.literal("executor_invite"),
  v.literal("heartbeat_warning"),
  v.literal("attestation_request"),
  v.literal("death_review_result"),
  v.literal("release_notice"),
)

export const listNotifications = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    ),
    kind: v.optional(kindUnion),
    recipientEmail: v.optional(v.string()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { status, kind } = args
    const recipientEmail = args.recipientEmail?.trim().toLowerCase() || undefined
    const order = args.order ?? "desc"

    const base =
      recipientEmail !== undefined
        ? ctx.db
            .query("notifications")
            .withIndex("by_recipientEmail", (q) =>
              q.eq("recipientEmail", recipientEmail),
            )
        : status !== undefined && kind !== undefined
          ? ctx.db
              .query("notifications")
              .withIndex("by_status_and_kind", (q) =>
                q.eq("status", status).eq("kind", kind),
              )
          : status !== undefined
            ? ctx.db
                .query("notifications")
                .withIndex("by_status", (q) => q.eq("status", status))
            : kind !== undefined
              ? ctx.db
                  .query("notifications")
                  .withIndex("by_kind", (q) => q.eq("kind", kind))
              : ctx.db.query("notifications")

    const result = await base.order(order).paginate(args.paginationOpts)
    return {
      ...result,
      page: result.page.map((n) => ({
        _id: n._id,
        _creationTime: n._creationTime,
        ownerId: n.ownerId ?? null,
        recipientEmail: n.recipientEmail,
        channel: n.channel,
        kind: n.kind,
        status: n.status,
        attempts: n.attempts,
        sentAt: n.sentAt ?? null,
        error: n.error ?? null,
      })),
    }
  },
})

/** Re-queue a failed notification (attempts reset so the cron picks it up). */
export const adminRetryNotification = mutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const row = await ctx.db.get(args.id)
    if (row === null) throw new ConvexError("NOT_FOUND")
    if (row.status !== "failed") throw new ConvexError("INVALID_STATE")
    await ctx.db.patch(args.id, { status: "pending", attempts: 0, error: undefined })
    return null
  },
})
