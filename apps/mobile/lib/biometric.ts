import * as SecureStore from "expo-secure-store"

// Stores the raw MASTER KEY bytes (base64) in the device hardware keystore, gated
// by biometrics (`requireAuthentication`). On biometric success we read the bytes
// back and import them — no PBKDF2, no passphrase. The secret is device-local and
// hardware-protected; the server never sees it. NEVER log the bytes.
//
// `requireAuthentication` items can't share a keychainService with non-authenticated
// ones, so this uses its OWN service — distinct from the PIN wrap ("wassiya.vault")
// and the WorkOS token store (default service). Namespaced by account so a second
// user on the device can't read account A's key.
const KEYCHAIN_SERVICE = "wassiya.vault.bio"
const PREFIX = "vault.bioMasterKey."

function keyFor(accountId: string): string {
  return PREFIX + accountId.replace(/[^\w.-]/g, "_")
}

/** Whether the device has a usable, sufficiently-secure enrolled biometric. */
export function isBiometricAvailable(): boolean {
  return SecureStore.canUseBiometricAuthentication()
}

export async function storeBiometricMasterKey(
  accountId: string,
  masterKeyBase64: string,
  prompt: string
): Promise<void> {
  await SecureStore.setItemAsync(keyFor(accountId), masterKeyBase64, {
    requireAuthentication: true,
    keychainService: KEYCHAIN_SERVICE,
    authenticationPrompt: prompt,
  })
}

/**
 * Prompts biometrics and returns the base64 master key. Returns null when the
 * prompt is cancelled OR when the key was invalidated by a biometric change
 * (getItemAsync resolves null or rejects) — the caller then falls back to the PIN.
 */
export async function readBiometricMasterKey(
  accountId: string,
  prompt: string
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(keyFor(accountId), {
      requireAuthentication: true,
      keychainService: KEYCHAIN_SERVICE,
      authenticationPrompt: prompt,
    })
  } catch {
    return null
  }
}

export async function clearBiometricMasterKey(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyFor(accountId), {
    keychainService: KEYCHAIN_SERVICE,
  })
}
