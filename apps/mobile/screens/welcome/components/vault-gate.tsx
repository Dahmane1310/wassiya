import { useEffect, useState } from "react"
import { Redirect } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { hasPinWrap } from "@/lib/pin-store"
import { useAccountId } from "@/stores/auth"
import { AccountDisabled } from "@/screens/welcome/components/account-disabled"
import { BrandedSplash } from "@/screens/welcome/components/branded-splash"

/**
 * Post-sign-in routing across THREE states. Unlock is now local (PIN/biometric), so
 * the destination depends on both server existence and whether THIS device has a PIN:
 *  - no server vault / onboarding incomplete → `/onboarding`
 *  - server vault + a local PIN wrap on this device → `/unlock`
 *  - server vault + NO local PIN wrap (new device / reinstall) → `/recovery`
 * The local check is async, so we hold on the splash until it resolves.
 */
export function VaultGate() {
  const status = useQuery(api.vault.getVaultStatus)
  const accountId = useAccountId()
  // null = still checking the device for a PIN wrap.
  const [localPin, setLocalPin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!accountId) return
    let active = true
    void hasPinWrap(accountId).then((has) => {
      if (active) setLocalPin(has)
    })
    return () => {
      active = false
    }
  }, [accountId])

  if (status === undefined || localPin === null) {
    return <BrandedSplash />
  }
  // Support-disabled account: every backend call is blocked, so route nowhere.
  if (status.disabled) {
    return <AccountDisabled />
  }
  if (!status.onboardingComplete || !status.recoveryWrappedKey) {
    return <Redirect href="/onboarding" />
  }
  return <Redirect href={localPin ? "/unlock" : "/recovery"} />
}
