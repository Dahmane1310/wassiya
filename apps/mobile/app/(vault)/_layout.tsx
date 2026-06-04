import { Redirect } from "expo-router"
import { Tabs } from "expo-router/js-tabs"
import { VaultTabBar } from "@/components/layout/vault-tab-bar"
import { useAuthStore } from "@/stores/auth"

// Open the group on Home, not the alphabetically-first child route.
export const unstable_settings = { initialRouteName: "home" }

/**
 * Authenticated tab shell. Gated on AUTH only (lazy-unlock model): signing in
 * opens the whole shell — Home, check-in, People metadata, Settings — none of
 * which need the master key. DECRYPTION is gated separately, INSIDE the Vault
 * tab (screens/vault), which derives the in-memory key on demand. So the heavy
 * passphrase/biometric step is deferred to the moment encrypted content is opened.
 */
export default function VaultLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <VaultTabBar {...props} />}
    />
  )
}
