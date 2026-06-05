import { Redirect } from "expo-router"
import { Tabs } from "expo-router/js-tabs"
import { VaultTabBar } from "@/components/layout/vault-tab-bar"
import { useAuthStore } from "@/stores/auth"
import { useVaultStore } from "@/stores/vault"

// Open the group on Home (the Vault heartbeat home), not the alphabetically-first child.
export const unstable_settings = { initialRouteName: "home" }

/**
 * Authenticated tab shell, gated on AUTH **and** an UNLOCKED vault. The redesign's
 * Vault home, Heirs and Wasiyyah all surface decrypted estate data, so the master
 * key must be derived before any tab mounts — the unlock step now precedes the shell
 * (auth → unlock → tabs), not the old lazy per-tab gate.
 *
 * Because the master key is in-memory only and `useAutoLock` flips `status` → `locked`
 * when the app backgrounds, this layout re-renders and bounces back to `/unlock` on
 * return, unmounting every tab (and its decrypted content) atomically.
 */
export default function VaultLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const vaultStatus = useVaultStore((s) => s.status)

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }
  if (vaultStatus !== "unlocked") {
    return <Redirect href="/unlock" />
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <VaultTabBar {...props} />}
    />
  )
}
