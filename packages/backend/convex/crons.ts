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

export default crons
