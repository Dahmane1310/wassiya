import {
  decryptData,
  deriveKeyFromPassword,
  encryptData,
  generateDataKeyBytes,
  generateRecoveryCode,
  generateSalt,
  importDataKey,
  normalizeRecoveryCode,
  unwrapKey,
  wrapKey,
  type EncryptedDataPackage,
} from "@workspace/crypto"

// The Recovery Code helpers now live in @workspace/crypto so the beneficiary
// enrollment flow (web) shares one implementation with the owner vault. Re-export
// for existing `@/lib/vault` consumers.
export { generateRecoveryCode, normalizeRecoveryCode }

// Pure client-side vault crypto orchestration — no React / Zustand / Convex.
//
// MODEL (PIN + Recovery Key, zero-knowledge preserved): a random high-entropy
// **master key (MK)** is generated ONCE at setup and is what every asset DEK is
// wrapped under (see lib/asset-crypto.ts). The raw MK bytes are then wrapped three
// independent ways:
//   1. under a key derived from the 6-digit PIN  → stored ONLY on the device (lib/pin-store)
//   2. under a key derived from a high-entropy Recovery Key → stored on the SERVER (the
//      true zero-knowledge root; high entropy ⇒ offline brute force infeasible)
//   3. raw, behind the hardware biometric gate → stored ONLY on the device (lib/biometric)
//
// THREAT MODEL (must not be oversold): the PIN is LOW-entropy. Its wrap lives in the
// device hardware keystore (encrypted at rest, device-only) so it is safe against
// casual access — but a rooted/jailbroken device could extract the blob and brute-force
// a 6-digit PIN offline (expo-secure-store exposes no Secure-Enclave attempt-limiter).
// So the PIN is CONVENIENCE security; the Recovery Key is the cryptographic root. The
// server only ever receives the recovery wrap + a verifier — never the PIN or its salt.

/**
 * Known plaintext sealed under the master key as the unlock/recovery verifier. Its
 * value is arbitrary — only the AES-GCM decrypt round-trip proves the key, so we
 * never compare the decrypted text back to this constant (the auth tag is the proof).
 */
export const SENTINEL = "wassiya:vault:v1"

/** Thrown when a PIN fails to unwrap the device-stored master key. */
export class WrongPinError extends Error {
  constructor() {
    super("Wrong PIN")
    this.name = "WrongPinError"
  }
}

/** Thrown when a Recovery Key fails to unwrap the server-stored master key. */
export class WrongRecoveryKeyError extends Error {
  constructor() {
    super("Wrong recovery key")
    this.name = "WrongRecoveryKeyError"
  }
}

/** The device-local PIN wrap of the master key (persisted by lib/pin-store). */
export type PinWrap = {
  pinSalt: string // base64, device-local — NEVER sent to the server
  wrappedKey: string // base64 AES-GCM ciphertext of the raw MK bytes
  iv: string
}

/** The server-stored recovery wrap + verifier (the zero-knowledge root). */
export type RecoverySetup = {
  recoverySalt: string
  recoveryWrappedKey: string
  recoveryWrapIv: string
  verifier: EncryptedDataPackage
}

/** An unwrapped session: the imported (non-extractable) MK + its raw bytes. The
 *  raw bytes are needed to (re-)wrap the MK for a new PIN / biometric enrolment;
 *  the caller MUST zero them (`mkBytes.fill(0)`) once done. */
export type UnlockedVault = {
  key: CryptoKey
  mkBytes: Uint8Array<ArrayBuffer>
}

export type VaultCreation = UnlockedVault & {
  pinWrap: PinWrap
  recovery: RecoverySetup
  recoveryCode: string // shown to the user ONCE; never persisted in plaintext
}

/**
 * Create a brand-new vault: mint a random master key, then build the PIN wrap
 * (device), the recovery wrap + verifier (server), and the one-time Recovery Key.
 * Returns the imported MK + raw bytes (caller stores the PIN wrap, optionally
 * enrolls biometric, then zeroes `mkBytes`).
 */
export async function createVault(pin: string): Promise<VaultCreation> {
  const mkBytes = generateDataKeyBytes()
  const key = await importDataKey(mkBytes)

  const pinWrap = await wrapMkForPin(mkBytes, pin)

  const recoveryCode = generateRecoveryCode()
  const recoverySalt = generateSalt()
  const recKey = await deriveKeyFromPassword(
    normalizeRecoveryCode(recoveryCode),
    recoverySalt
  )
  const recWrapped = await wrapKey(mkBytes, recKey)
  const verifier = await encryptData(SENTINEL, key)

  return {
    key,
    mkBytes,
    pinWrap,
    recovery: {
      recoverySalt,
      recoveryWrappedKey: recWrapped.wrappedKey,
      recoveryWrapIv: recWrapped.iv,
      verifier,
    },
    recoveryCode,
  }
}

/** (Re-)wrap the raw master key under a freshly-salted PIN-derived key. Used at
 *  setup, on PIN change, and after a recovery to set the new local PIN. */
export async function wrapMkForPin(
  mkBytes: Uint8Array<ArrayBuffer>,
  pin: string
): Promise<PinWrap> {
  const pinSalt = generateSalt()
  const pinKey = await deriveKeyFromPassword(pin, pinSalt)
  const { wrappedKey, iv } = await wrapKey(mkBytes, pinKey)
  return { pinSalt, wrappedKey, iv }
}

/** Unwrap the master key with the device PIN wrap. Throws WrongPinError on a bad
 *  PIN (the AES-GCM auth tag rejects the wrong key). */
export async function unwrapWithPin(
  pin: string,
  pinWrap: PinWrap
): Promise<UnlockedVault> {
  const pinKey = await deriveKeyFromPassword(pin, pinWrap.pinSalt)
  let mkBytes: Uint8Array<ArrayBuffer>
  try {
    mkBytes = await unwrapKey(pinWrap.wrappedKey, pinWrap.iv, pinKey)
  } catch {
    throw new WrongPinError()
  }
  const key = await importDataKey(mkBytes)
  return { key, mkBytes }
}

/** Unwrap the master key with the server recovery wrap + the user's Recovery Key.
 *  Throws WrongRecoveryKeyError on a bad code. Returns the MK + raw bytes so the
 *  caller can immediately set a new local PIN. */
export async function unwrapWithRecovery(
  recoveryCode: string,
  recovery: Pick<
    RecoverySetup,
    "recoverySalt" | "recoveryWrappedKey" | "recoveryWrapIv"
  >
): Promise<UnlockedVault> {
  const recKey = await deriveKeyFromPassword(
    normalizeRecoveryCode(recoveryCode),
    recovery.recoverySalt
  )
  let mkBytes: Uint8Array<ArrayBuffer>
  try {
    mkBytes = await unwrapKey(
      recovery.recoveryWrappedKey,
      recovery.recoveryWrapIv,
      recKey
    )
  } catch {
    throw new WrongRecoveryKeyError()
  }
  const key = await importDataKey(mkBytes)
  return { key, mkBytes }
}

/** Import raw master-key bytes (e.g. read back from the biometric keystore) into a
 *  non-extractable CryptoKey. Optionally cross-checks the verifier when present. */
export async function importMasterKey(
  mkBytes: Uint8Array<ArrayBuffer>,
  verifier?: EncryptedDataPackage
): Promise<CryptoKey> {
  const key = await importDataKey(mkBytes)
  if (verifier) {
    // Sanity cross-check; the auth tag throws if the bytes are wrong.
    await decryptData(verifier.ciphertext, verifier.iv, key)
  }
  return key
}
