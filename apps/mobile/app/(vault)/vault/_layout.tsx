import { Stack } from "expo-router"

/**
 * The Assets tab's nested stack (index / new / [id] / edit). Decryption is no
 * longer gated here: the parent shell (`app/(vault)/_layout.tsx`) now requires an
 * unlocked vault before any tab mounts, and `useAutoLock` bounces back to `/unlock`
 * on background — so by the time this stack renders, the master key is in memory.
 * The nested children live in this Stack, not the parent Tabs navigator, so they
 * never leak into the bottom tab bar.
 */
export default function VaultStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
