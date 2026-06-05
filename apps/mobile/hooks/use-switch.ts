import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"

const DAY_MS = 24 * 60 * 60 * 1000
const toDays = (ms: number) => Math.round(ms / DAY_MS)

export type SwitchStatus =
  | "loading"
  | "unarmed"
  | "active"
  | "grace"
  | "pendingVerification"
  | "released"
  | "paused"

export type SwitchView = {
  status: SwitchStatus
  /** Whole days until the next transition (check-in due, or grace expiry). ≥ 0. */
  nextDueDays: number
  cadenceDays: number
  graceDays: number
  streak: number
  lastCheckInAt: number | null
  checkIn: () => Promise<void>
  arm: (intervalMs: number, graceMs: number) => Promise<void>
}

/**
 * The dead-man's switch, wired to Convex. The "I'm here" check-in and onboarding
 * "arm" are real mutations; the live state drives the Vault home. The countdown is
 * derived on the client from the raw `nextDeadlineAt` (the query never returns a
 * wall-clock-dependent value — see backend `getSwitchState`).
 */
export function useSwitch(): SwitchView {
  const state = useQuery(api.switch.getSwitchState)
  const recordCheckIn = useMutation(api.switch.recordCheckIn)
  const armSwitch = useMutation(api.switch.armSwitch)

  const status: SwitchStatus =
    state === undefined ? "loading" : state === null ? "unarmed" : state.state

  const nextDueDays =
    state == null
      ? 0
      : Math.max(0, Math.ceil((state.nextDeadlineAt - Date.now()) / DAY_MS))

  return {
    status,
    nextDueDays,
    cadenceDays: state ? toDays(state.checkInIntervalMs) : 30,
    graceDays: state ? toDays(state.gracePeriodMs) : 14,
    streak: state?.checkInStreak ?? 0,
    lastCheckInAt: state?.lastCheckInAt ?? null,
    checkIn: async () => {
      await recordCheckIn({})
    },
    arm: async (intervalMs, graceMs) => {
      await armSwitch({ checkInIntervalMs: intervalMs, gracePeriodMs: graceMs })
    },
  }
}
