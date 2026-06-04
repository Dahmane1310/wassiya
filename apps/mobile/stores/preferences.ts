import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Client-only UI store, persisted to AsyncStorage.
//
// IMPORTANT: Convex (useQuery/useMutation) is the source of truth for *server*
// state. Keep only client/UI state here (ephemeral flags, local preferences,
// draft state) — do NOT mirror server entities into Zustand. The biometric
// SECRET lives in the hardware keystore (lib/biometric.ts); only the boolean
// "is it enabled" flag lives here.
type PreferencesState = {
  hasSeenWelcome: boolean
  setHasSeenWelcome: (value: boolean) => void
  biometricEnabled: boolean
  setBiometricEnabled: (value: boolean) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
      biometricEnabled: false,
      setBiometricEnabled: (value) => set({ biometricEnabled: value }),
    }),
    {
      name: "preferences",
      // AsyncStorage is async, so the store rehydrates after the first render
      // (initial render shows defaults). No SSR hydration concern on native.
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
