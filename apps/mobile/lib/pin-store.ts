import * as SecureStore from "expo-secure-store"
import { type PinWrap } from "@/lib/vault"

// The device-local PIN wrap of the master key (lib/vault `PinWrap`). It is stored
// ONLY here, in the device hardware keystore — NEVER on the server (that's what
// keeps a low-entropy PIN from being a server-side brute-force target). No
// `requireAuthentication`: the PIN itself is the gate, so the blob must be readable
// without a biometric prompt. `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps it encrypted at
// rest, off iCloud/Android backups, and unreadable while the device is locked.
//
// The key is NAMESPACED BY ACCOUNT so a second user signing in on the same device
// finds no wrap of their own (and can't reach account A's), while account A keeps
// its PIN across an ordinary sign-out/sign-in.
const KEYCHAIN_SERVICE = "wassiya.vault"
const PREFIX = "vault.pinWrap."

// SecureStore keys allow only [A-Za-z0-9._-]; fold anything else out of the id.
function keyFor(accountId: string): string {
  return PREFIX + accountId.replace(/[^\w.-]/g, "_")
}

const OPTS = {
  keychainService: KEYCHAIN_SERVICE,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const

export async function storePinWrap(
  accountId: string,
  wrap: PinWrap
): Promise<void> {
  await SecureStore.setItemAsync(keyFor(accountId), JSON.stringify(wrap), OPTS)
}

/** The device PIN wrap for this account, or null if this device has never set a
 *  PIN for it (→ the routing gate sends a new device to recovery). */
export async function readPinWrap(accountId: string): Promise<PinWrap | null> {
  try {
    const raw = await SecureStore.getItemAsync(keyFor(accountId), OPTS)
    return raw ? (JSON.parse(raw) as PinWrap) : null
  } catch {
    return null
  }
}

export async function hasPinWrap(accountId: string): Promise<boolean> {
  return (await readPinWrap(accountId)) !== null
}

export async function clearPinWrap(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyFor(accountId), {
    keychainService: KEYCHAIN_SERVICE,
  })
}
