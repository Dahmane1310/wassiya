import { ConvexError, v } from "convex/values"
import { mutation } from "../_generated/server"
import { expandOwnerId, logAdminAction, requireAdmin } from "../lib/adminAuth"

// Support pause/resume of a user's dead-man's switch (hospitalization, dispute,
// false alarm). "paused" rows are invisible to the hourly sweep — it only ranges
// the active/grace/pendingVerification states — so pausing freezes the machine.
// (File named switchControl: `api.admin.switch` would collide with the keyword.)

export const adminPauseSwitch = mutation({
  args: { ownerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const row = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (row === null) throw new ConvexError("NOT_FOUND")
    if (row.state === "released" || row.state === "paused") {
      throw new ConvexError("INVALID_STATE")
    }
    const from = row.state
    await ctx.db.patch(row._id, {
      state: "paused",
      graceStartedAt: undefined,
      pendingVerificationStartedAt: undefined,
    })
    await logAdminAction(ctx, {
      ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "switch_state_changed",
      targetTable: "switchState",
      targetId: row._id,
      meta: { from, to: "paused" },
    })
    return null
  },
})

export const adminResumeSwitch = mutation({
  args: { ownerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const row = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (row === null) throw new ConvexError("NOT_FOUND")
    if (row.state !== "paused") throw new ConvexError("INVALID_STATE")
    // Resume opens a fresh full check-in window from now. Not a real check-in:
    // no checkIns row, no streak bump — the owner didn't act.
    const now = Date.now()
    await ctx.db.patch(row._id, {
      state: "active",
      lastCheckInAt: now,
      nextDeadlineAt: now + row.checkInIntervalMs,
    })
    await logAdminAction(ctx, {
      ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "switch_state_changed",
      targetTable: "switchState",
      targetId: row._id,
      meta: { from: "paused", to: "active" },
    })
    return null
  },
})
