import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Advance the dead-man's switch: sweep rows whose deadline has passed
// (active → grace, grace → pendingVerification). Hourly is snappy for day-scale
// cadences and cheap — the sweep is indexed (by_state_and_nextDeadlineAt) and
// bounded (batched + self-rescheduling).
crons.interval(
  "sweep dead-man switch",
  { hours: 1 },
  internal.switch.sweepSwitch,
  {}
)

// Expire elapsed trials / subscriptions (trialing|active|past_due past their
// currentPeriodEnd → expired). Day-scale validity makes 6h plenty; the sweep is indexed
// (by_status_and_currentPeriodEnd) and batched. Lifetime rows have no anchor and are skipped.
crons.interval(
  "sweep expired subscriptions",
  { hours: 6 },
  internal.entitlements.sweepEntitlements,
  {}
)

// Email the notification outbox (pending → sent/failed via Resend). 10 minutes
// keeps grace warnings timely without hammering the API; the drain is indexed
// (by_status), batched, and a no-op until RESEND_API_KEY/EMAIL_FROM are set.
crons.interval(
  "drain notification outbox",
  { minutes: 10 },
  internal.notificationSender.drainNotifications,
  {}
)

export default crons
