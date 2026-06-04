import {
  decryptData,
  deriveKeyFromPassword,
  encryptData,
  generateSalt,
  type EncryptedDataPackage,
} from "@workspace/crypto"

// Pure client-side vault crypto orchestration — no React / Zustand / Convex.
// The master passphrase and the derived key NEVER leave the device.

/**
 * Known plaintext sealed under the master key as the unlock verifier. Its value
 * is arbitrary — only the AES-GCM decrypt round-trip proves the key, so we never
 * compare the decrypted text back to this constant (that would just be a footgun
 * if it ever changed; the auth tag is the real proof).
 */
export const SENTINEL = "wassiya:vault:v1"

/** Thrown when an unlock passphrase fails to decrypt the stored verifier. */
export class WrongPassphraseError extends Error {
  constructor() {
    super("Wrong passphrase")
    this.name = "WrongPassphraseError"
  }
}

export type VaultSetup = {
  salt: string
  verifier: EncryptedDataPackage
  key: CryptoKey
}

/**
 * Create a brand-new vault: generate the write-once salt, derive the master key,
 * and seal the verifier. `generateSalt()` is called HERE AND ONLY HERE — exactly
 * once per user. NEVER call this when the server already has a salt (it would
 * orphan every encrypted record); the routing gate guarantees onboarding only
 * renders when there is no salt.
 */
export async function createVault(passphrase: string): Promise<VaultSetup> {
  const salt = generateSalt()
  const key = await deriveKeyFromPassword(passphrase, salt)
  const verifier = await encryptData(SENTINEL, key)
  return { salt, verifier, key }
}

/**
 * Verify a passphrase against the stored salt + verifier. Derives the key and
 * attempts to decrypt the verifier; decrypt SUCCESS is the proof (the GCM auth
 * tag rejects a wrong key). Returns the master key, or throws WrongPassphraseError.
 */
export async function verifyPassphrase(
  passphrase: string,
  salt: string,
  verifier: EncryptedDataPackage
): Promise<CryptoKey> {
  const key = await deriveKeyFromPassword(passphrase, salt)
  try {
    await decryptData(verifier.ciphertext, verifier.iv, key)
  } catch {
    throw new WrongPassphraseError()
  }
  return key
}
