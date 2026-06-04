import { Stack } from "expo-router"
import { ScreenContainer } from "@/components/layout/screen-container"
import { VaultUnlock } from "@/screens/vault/components/vault-unlock"
import { useVaultStore } from "@/stores/vault"

/**
 * The Vault tab's nested stack AND its decryption gate (security spine of the
 * lazy-unlock model). While the vault is locked we render `VaultUnlock` INSTEAD
 * of the Stack, so no asset route ever mounts:
 *  - auto-lock (app backgrounds) flips `status` → this re-renders → the Stack
 *    and every asset screen unmount atomically; content vanishes.
 *  - a cold deep-link to /vault/[id] is gated on the first synchronous render
 *    because the vault session starts `locked` and is never persisted.
 * The nested children (index / new / [id]) live in this Stack, not the parent
 * Tabs navigator, so they never leak into the bottom tab bar.
 */
export default function VaultStackLayout() {
  const status = useVaultStore((s) => s.status)

  if (status !== "unlocked") {
    return (
      <ScreenContainer scroll edges={["top"]}>
        <VaultUnlock />
      </ScreenContainer>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
