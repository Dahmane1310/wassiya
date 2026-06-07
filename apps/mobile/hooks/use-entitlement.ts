import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"

const DAY_MS = 24 * 60 * 60 * 1000

export type Plan = "trial" | "annual" | "lifetime"

export type EntitlementView = {
  /** Query still resolving — treat as "not expired" so we never flash the paywall. */
  loading: boolean
  plan: Plan
  isPaid: boolean
  isTrialing: boolean
  /** Read-only state: trial lapsed (or sub ended) and not paid. */
  isExpired: boolean
  /** Whole days left in the trial; 0 when not trialing. */
  trialDaysLeft: number
  currentPeriodEnd: number | null
}

/**
 * The current user's entitlement, derived on the client from the raw `currentPeriodEnd`
 * (the query never returns a wall-clock-dependent value — same contract as `useSwitch`).
 * `trialDaysLeft` won't tick live across the zero boundary; that's the accepted precedent.
 */
export function useEntitlement(): EntitlementView {
  const ent = useQuery(api.entitlements.getEntitlement)
  const now = Date.now()

  if (ent === undefined || ent === null) {
    return {
      loading: ent === undefined,
      plan: "trial",
      isPaid: false,
      isTrialing: false,
      isExpired: false, // never gate while loading / unauthenticated
      trialDaysLeft: 0,
      currentPeriodEnd: null,
    }
  }

  const plan = ent.plan as Plan
  const end = ent.currentPeriodEnd
  const isPaid =
    (plan === "lifetime" && ent.status === "active") ||
    (plan === "annual" && ent.status === "active" && (end ?? 0) > now)
  const isTrialing =
    plan === "trial" && ent.status === "trialing" && (end == null || end > now)
  const isExpired = !isPaid && !isTrialing
  const trialDaysLeft =
    isTrialing && end != null ? Math.max(0, Math.ceil((end - now) / DAY_MS)) : 0

  return {
    loading: false,
    plan,
    isPaid,
    isTrialing,
    isExpired,
    trialDaysLeft,
    currentPeriodEnd: end,
  }
}
