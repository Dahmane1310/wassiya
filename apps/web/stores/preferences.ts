import { useEffect, useState } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Example client-only UI store, persisted to localStorage.
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
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// Next.js renders on the server, where persisted values aren't available, so the
// first client render must match the server (defaults). Gate reads of persisted
// state on this hook to avoid hydration mismatches:
//
//   const hydrated = useHasHydrated()
//   const seen = usePreferences((s) => s.hasSeenWelcome)
//   return <Welcome hidden={hydrated && seen} />
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
