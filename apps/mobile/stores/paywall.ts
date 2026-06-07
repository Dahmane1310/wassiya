import { create } from "zustand"

// Visibility of the single, app-wide paywall sheet. A store (not per-screen state) so
// any gated surface — including a mutation's catch block, which is outside React — can
// trigger it imperatively via `usePaywallStore.getState().show()`. One PaywallSheet
// instance subscribes to `open`; see components/paywall/paywall-sheet.tsx.
type PaywallState = {
  open: boolean
  show: () => void
  hide: () => void
}

export const usePaywallStore = create<PaywallState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))

/** Imperative trigger usable from non-hook contexts (mutation catch blocks). */
export function showPaywall(): void {
  usePaywallStore.getState().show()
}
