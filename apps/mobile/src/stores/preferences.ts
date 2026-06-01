import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Example client-only UI store, persisted to AsyncStorage.
//
// IMPORTANT: Convex (useQuery/useMutation) is the source of truth for *server*
// state. Keep only client/UI state here (ephemeral flags, local preferences,
// draft state) — do NOT mirror server entities into Zustand.
type PreferencesState = {
  hasSeenWelcome: boolean
  setHasSeenWelcome: (value: boolean) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
    }),
    {
      name: "preferences",
      // AsyncStorage is async, so the store rehydrates after the first render
      // (initial render shows defaults). No SSR hydration concern on native.
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
