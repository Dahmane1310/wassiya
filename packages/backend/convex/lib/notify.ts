import { type Doc } from "../_generated/dataModel"
import { type MutationCtx } from "../_generated/server"

// Outbox enqueue helper. Rows are drained by notificationSender.drainNotifications
// (cron). Payload holds NON-SECRET template variables only — never vault content.
//
// Deliberately NO invite emails: the raw invite token never reaches the server
// (only its hash) — the owner shares the link out-of-band from their device.

export async function enqueueNotification(
  ctx: MutationCtx,
  args: {
    ownerId?: string
    recipientEmail: string
    kind: Doc<"notifications">["kind"]
    payload?: Record<string, string>
  },
): Promise<void> {
  await ctx.db.insert("notifications", {
    ownerId: args.ownerId,
    recipientEmail: args.recipientEmail.trim().toLowerCase(),
    channel: "email",
    kind: args.kind,
    status: "pending",
    attempts: 0,
    payload: args.payload,
  })
}
