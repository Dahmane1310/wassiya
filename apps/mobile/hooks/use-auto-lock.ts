import { useEffect } from "react"
import { AppState } from "react-native"
import { useVaultStore } from "@/stores/vault"

/**
 * Re-lock the vault when the app is backgrounded. The master key is in-memory
 * only, so locking on background means a backgrounded / handed-over phone can't
 * expose the vault — and biometric unlock makes re-entry one touch. Triggers on
 * "background" (a real backgrounding) but not iOS's transient "inactive" (app
 * switcher peek / control center), to avoid annoying re-locks. Mount once near
 * the app root (app/_layout.tsx).
 */
export function useAutoLock() {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (
        state === "background" &&
        useVaultStore.getState().status === "unlocked"
      ) {
        useVaultStore.getState().lock()
      }
    })
    return () => sub.remove()
  }, [])
}
