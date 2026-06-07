import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Client-only UI store, persisted to AsyncStorage.
//
// IMPORTANT: Convex (useQuery/useMutation) is the source of truth for *server*
// state. Keep only client/UI state here (ephemeral flags, local preferences,
// draft state) — do NOT mirror server entities into Zustand. The biometric SECRET
// and the PIN wrap live in the hardware keystore (lib/biometric.ts, lib/pin-store.ts);
// only the per-account "is biometric enrolled" flag + the convenience PIN attempt
// counter live here. Both are keyed by accountId so two users on one device don't
// share each other's state.
type PreferencesState = {
  hasSeenWelcome: boolean
  setHasSeenWelcome: (value: boolean) => void
  // Account ids (JWT sub) that have a biometric master-key enrolled on this device.
  biometricAccounts: string[]
  setBiometricEnabled: (accountId: string, value: boolean) => void
  // Consecutive wrong-PIN attempts per account. Convenience cooldown only — the PIN
  // wrap lives on-device, so this can't impose real (offline) rate-limiting.
  pinAttempts: Record<string, number>
  bumpPinAttempts: (accountId: string) => void
  resetPinAttempts: (accountId: string) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
      biometricAccounts: [],
      setBiometricEnabled: (accountId, value) =>
        set((s) => ({
          biometricAccounts: value
            ? [...new Set([...s.biometricAccounts, accountId])]
            : s.biometricAccounts.filter((id) => id !== accountId),
        })),
      pinAttempts: {},
      bumpPinAttempts: (accountId) =>
        set((s) => ({
          pinAttempts: {
            ...s.pinAttempts,
            [accountId]: (s.pinAttempts[accountId] ?? 0) + 1,
          },
        })),
      resetPinAttempts: (accountId) =>
        set((s) => {
          if (!(accountId in s.pinAttempts)) return s
          const next = { ...s.pinAttempts }
          delete next[accountId]
          return { pinAttempts: next }
        }),
    }),
    {
      name: "preferences",
      // AsyncStorage is async, so the store rehydrates after the first render
      // (initial render shows defaults). No SSR hydration concern on native.
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

/** Whether biometric unlock is enrolled for an account on this device. */
export function useBiometricEnabled(accountId: string | null): boolean {
  return usePreferences((s) =>
    accountId ? s.biometricAccounts.includes(accountId) : false
  )
}
