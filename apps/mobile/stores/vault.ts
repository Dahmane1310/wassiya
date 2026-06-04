import { create } from "zustand"

// The in-memory vault session. The master key is held ONLY here, in memory:
// never persisted (no AsyncStorage/SecureStore, no persist middleware), never
// serialized, never logged. A CryptoKey is non-extractable anyway. Every cold
// start begins `locked` by design — the user re-derives the key via unlock.
type VaultState = {
  masterKey: CryptoKey | null
  status: "locked" | "unlocked"
  setUnlocked: (key: CryptoKey) => void
  lock: () => void
}

export const useVaultStore = create<VaultState>((set) => ({
  masterKey: null,
  status: "locked",
  setUnlocked: (key) => set({ masterKey: key, status: "unlocked" }),
  lock: () => set({ masterKey: null, status: "locked" }),
}))

/** The in-memory master key, or null when locked. For future asset screens. */
export function useMasterKey(): CryptoKey | null {
  return useVaultStore((s) => s.masterKey)
}
