import { Redirect } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { BrandedSplash } from "@/screens/welcome/components/branded-splash"

/**
 * Post-sign-in routing. A new user (no salt / onboarding incomplete) goes to
 * onboarding; everyone else lands on the Home tab — even while the vault is
 * locked. In the lazy-unlock model the shell is open to authenticated users;
 * the Vault tab itself prompts for the passphrase/biometric when opened.
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
  return <Redirect href="/home" />
}
