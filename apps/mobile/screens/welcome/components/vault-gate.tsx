import { Redirect } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { BrandedSplash } from "@/screens/welcome/components/branded-splash"

/**
 * Post-sign-in routing. A new user (no salt / onboarding incomplete) goes to
 * onboarding (which derives + holds the master key, landing them unlocked).
 * A returning user goes to `/unlock` to re-derive the in-memory key — the unlock
 * step now precedes the tab shell, since every redesigned tab shows decrypted data.
 * Declarative `<Redirect>` (like app/callback.tsx) — render-safe, no effect.
 */
export function VaultGate() {
  // `undefined` = still loading (distinct from a resolved-empty status).
  const status = useQuery(api.vault.getVaultStatus)

  if (status === undefined) {
    return <BrandedSplash />
  }
  if (!status.vaultSalt || !status.onboardingComplete) {
    return <Redirect href="/onboarding" />
  }
  return <Redirect href="/unlock" />
}
