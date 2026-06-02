import "../src/global.css"

import { useEffect } from "react"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { Stack } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { PortalHost } from "@rn-primitives/portal"
import { useAuthFromWorkOS, useAuthStore } from "@/src/stores/auth"

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

export default function RootLayout() {
  // Load persisted tokens from SecureStore once on launch. No AuthProvider
  // needed — the Zustand store is global.
  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkOS}>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Wassiya" }} />
          <Stack.Screen name="callback" options={{ headerShown: false }} />
        </Stack>
        {/* Overlay teleport target for dialog / dropdown-menu / popover / select. */}
        <PortalHost />
      </ConvexProviderWithAuth>
    </GestureHandlerRootView>
  )
}
