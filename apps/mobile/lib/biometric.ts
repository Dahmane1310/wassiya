import * as SecureStore from "expo-secure-store"

// Stores the vault PASSPHRASE in the device hardware keystore, gated by biometrics
// (`requireAuthentication`). The master key is non-extractable so it can't be
// stored; instead we re-derive it from the passphrase on biometric success. The
// secret is device-local and hardware-protected — the server never sees it.
// NEVER log the passphrase.
const PASSPHRASE_KEY = "vault.biometricPassphrase"
// A keychainService distinct from the WorkOS token storage (which uses the
// default service): `requireAuthentication` items can't share a service with
// non-authenticated ones. The same service is used for store/read/clear.
const KEYCHAIN_SERVICE = "wassiya.vault"

/** Whether the device has a usable, sufficiently-secure enrolled biometric. */
export function isBiometricAvailable(): boolean {
  return SecureStore.canUseBiometricAuthentication()
}

export async function storeBiometricPassphrase(
  passphrase: string,
  prompt: string
): Promise<void> {
  await SecureStore.setItemAsync(PASSPHRASE_KEY, passphrase, {
    requireAuthentication: true,
    keychainService: KEYCHAIN_SERVICE,
    authenticationPrompt: prompt,
  })
}

/**
 * Prompts biometrics and returns the passphrase. Returns null when the prompt is
 * cancelled OR when the key was invalidated by a biometric change (getItemAsync
 * resolves null or rejects in those cases) — the caller then falls back to the
 * passphrase.
 */
export async function readBiometricPassphrase(
  prompt: string
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PASSPHRASE_KEY, {
      requireAuthentication: true,
      keychainService: KEYCHAIN_SERVICE,
      authenticationPrompt: prompt,
    })
  } catch {
    return null
  }
}

export async function clearBiometricPassphrase(): Promise<void> {
  await SecureStore.deleteItemAsync(PASSPHRASE_KEY, {
    keychainService: KEYCHAIN_SERVICE,
  })
}
