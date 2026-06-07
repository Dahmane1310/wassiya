import "../global.css"

import { useEffect, useState } from "react"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { Stack } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { PortalHost } from "@rn-primitives/portal"
import * as SplashScreen from "expo-splash-screen"
import { PaywallSheet } from "@/components/paywall/paywall-sheet"
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter"
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
} from "@expo-google-fonts/tajawal"
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono"
import { useAutoLock } from "@/hooks/use-auto-lock"
import { initLanguage } from "@/lib/i18n"
import { initTheme } from "@/lib/theme"
import { useAuthFromWorkOS, useAuthStore } from "@/stores/auth"

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

// Keep the native splash up until the brand fonts resolve. The registered
// family keys ("Inter_400Regular", ...) are exactly the values the Uniwind
// `--font-*` tokens point at (see global.css @theme).
void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  })

  const [prefsReady, setPrefsReady] = useState(false)

  // Load persisted tokens from SecureStore once on launch. No AuthProvider
  // needed — the Zustand store is global. Independent of font loading.
  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  // Restore the saved language + theme before first paint (avoids a flash).
  useEffect(() => {
    void Promise.all([initLanguage(), initTheme()]).finally(() =>
      setPrefsReady(true)
    )
  }, [])

  const ready = (fontsLoaded || fontError) && prefsReady

  // Hide the splash once fonts AND language are ready. On font error we still
  // proceed and let text degrade rather than hang on the splash forever.
  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync()
    }
  }, [ready])

  // Re-lock the vault whenever the app backgrounds (biometric makes re-entry cheap).
  useAutoLock()

  // Gate AFTER all hooks (rules of hooks).
  if (!ready) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkOS}>
        <Stack>
          {/* Full-bleed branded Welcome hero — no native header. */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="callback" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="unlock" options={{ headerShown: false }} />
          <Stack.Screen name="recovery" options={{ headerShown: false }} />
          <Stack.Screen name="contacts" options={{ headerShown: false }} />
          {/* Authenticated tab shell (Vault · Assets · Heirs · Wasiyyah · Profile). */}
          <Stack.Screen name="(vault)" options={{ headerShown: false }} />
        </Stack>
        {/* Overlay teleport target for dialog / dropdown-menu / popover / select. */}
        <PortalHost />
        {/* Single app-wide paywall — opened imperatively via usePaywallStore. */}
        <PaywallSheet />
      </ConvexProviderWithAuth>
    </GestureHandlerRootView>
  )
}
