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

export default crons
