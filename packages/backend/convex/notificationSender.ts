import { v } from "convex/values"
import { internal } from "./_generated/api"
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server"

// Outbox drain: a cron-driven action that emails pending notifications via the
// Resend REST API (plain fetch — default runtime). Config lives in the CONVEX
// DEPLOYMENT env (`npx convex env set RESEND_API_KEY …` / `EMAIL_FROM …`);
// without both, the drain exits quietly so dev deployments never error.

const BATCH = 10
const MAX_ATTEMPTS = 5

/** Plain-language email templates. Payload vars are non-secret by contract. */
function template(
  kind: string,
  payload: Record<string, string>,
): { subject: string; text: string } {
  switch (kind) {
    case "heartbeat_warning": {
      const ends = payload.graceEndsAt ? new Date(Number(payload.graceEndsAt)) : null
      return {
        subject: "Wassiya — please check in",
        text:
          `You missed your regular Wassiya check-in, so a grace period has started` +
          (ends ? ` and ends on ${ends.toUTCString()}.` : `.`) +
          `\n\nOpen the Wassiya app and tap "I'm here" to confirm everything is fine. ` +
          `If you don't, your legacy release process will begin.`,
      }
    }
    case "death_review_result": {
      const approved = payload.decision === "approved"
      const reason = payload.notes?.trim()
      return {
        subject: approved
          ? "Wassiya — death report approved"
          : "Wassiya — death report reviewed",
        text: approved
          ? `The death report you submitted has been reviewed and approved. ` +
            `The legacy left for you is being released — sign in to the Wassiya portal to view it.`
          : `The death report you submitted was reviewed and could not be approved.` +
            (reason ? `\n\nReviewer's note: ${reason}` : ``) +
            `\n\nYou can submit a corrected report from the Wassiya portal, or reply to this email for help.`,
      }
    }
    case "release_notice": {
      const who = payload.ownerName ? `${payload.ownerName}` : `Someone`
      return {
        subject: "Wassiya — a legacy has been released to you",
        text:
          `${who} entrusted you with part of their legacy, and it has now been released. ` +
          `Sign in to the Wassiya portal with this email address to open what was left for you.`,
      }
    }
    case "password_reset": {
      return {
        subject: "Wassiya — reset your password",
        text:
          `Someone asked to reset the password for your Wassiya account. ` +
          `If that was you, open this link to choose a new password (it expires soon):\n\n` +
          `${payload.url ?? ""}\n\n` +
          `If you didn't ask for this, you can ignore this email — nothing changes.`,
      }
    }
    default:
      return {
        subject: "Wassiya notification",
        text: "You have a new notification from Wassiya.",
      }
  }
}

export const listPendingBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(BATCH)
    return rows
      .filter((r) => r.channel === "email" && r.attempts < MAX_ATTEMPTS)
      .map((r) => ({
        _id: r._id,
        recipientEmail: r.recipientEmail,
        kind: r.kind as string,
        payload: r.payload ?? {},
      }))
  },
})

export const markResult = internalMutation({
  args: {
    id: v.id("notifications"),
    ok: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id)
    if (row === null) return null
    if (args.ok) {
      await ctx.db.patch(args.id, {
        status: "sent",
        sentAt: Date.now(),
        attempts: row.attempts + 1,
        error: undefined,
      })
    } else {
      await ctx.db.patch(args.id, {
        status: "failed",
        attempts: row.attempts + 1,
        error: args.error?.slice(0, 500),
      })
    }
    return null
  },
})

export const drainNotifications = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM
    if (!apiKey || !from) {
      console.log("notificationSender: RESEND_API_KEY/EMAIL_FROM not set — skipping drain")
      return null
    }
    const batch = await ctx.runQuery(internal.notificationSender.listPendingBatch, {})
    for (const n of batch) {
      const { subject, text } = template(n.kind, n.payload)
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to: [n.recipientEmail], subject, text }),
        })
        if (res.ok) {
          await ctx.runMutation(internal.notificationSender.markResult, {
            id: n._id,
            ok: true,
          })
        } else {
          const body = await res.text()
          await ctx.runMutation(internal.notificationSender.markResult, {
            id: n._id,
            ok: false,
            error: `HTTP ${res.status}: ${body}`,
          })
        }
      } catch (e) {
        await ctx.runMutation(internal.notificationSender.markResult, {
          id: n._id,
          ok: false,
          error: e instanceof Error ? e.message : "fetch failed",
        })
      }
    }
    return null
  },
})
