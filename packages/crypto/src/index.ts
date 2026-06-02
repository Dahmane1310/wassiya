/**
 * @workspace/crypto — client-side, zero-knowledge encryption for Wassiya.
 *
 * Plaintext, the master passphrase, and the derived key NEVER leave the device.
 * The backend only ever receives `EncryptedDataPackage` (ciphertext + iv) and
 * the non-secret salt. Run this on the client only — never in a Convex function
 * or a Next.js server action.
 *
 * Web: uses the native `globalThis.crypto`. React Native (Hermes): install
 * `react-native-quick-crypto` and call `configureCrypto(...)` at startup.
 */

export interface EncryptedDataPackage {
  /** Base64 AES-GCM ciphertext (the 16-byte auth tag is appended by WebCrypto). */
  ciphertext: string
  /** Base64 12-byte IV — unique per encryption, generated internally. */
  iv: string
}

/** The minimal WebCrypto surface this package needs. */
export interface CryptoProvider {
  getRandomValues<T extends ArrayBufferView>(array: T): T
  subtle: SubtleCrypto
}

const PBKDF2_ITERATIONS = 210_000 // OWASP 2023 floor for PBKDF2-HMAC-SHA256
const PBKDF2_HASH = "SHA-256"
const AES_KEY_BITS = 256
const IV_BYTES = 12
const SALT_BYTES = 16

let injected: CryptoProvider | undefined

/**
 * Inject a WebCrypto provider. REQUIRED on React Native (pass
 * react-native-quick-crypto's webcrypto object). Optional on web — defaults to
 * the native `globalThis.crypto`.
 */
export function configureCrypto(provider: CryptoProvider): void {
  injected = provider
}

function getCrypto(): CryptoProvider {
  const provider = injected ?? (globalThis.crypto as CryptoProvider | undefined)
  if (!provider?.subtle) {
    throw new Error(
      "@workspace/crypto: no WebCrypto provider. On React Native, install " +
        "react-native-quick-crypto and call configureCrypto(...) at startup.",
    )
  }
  return provider
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function bytesToBase64(bytes: Uint8Array): string {
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!
    const b1 = i + 1 < bytes.length ? bytes[i + 1]! : 0
    const b2 = i + 2 < bytes.length ? bytes[i + 2]! : 0
    out += B64[b0 >> 2]
    out += B64[((b0 & 3) << 4) | (b1 >> 4)]
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : "="
    out += i + 2 < bytes.length ? B64[b2 & 63] : "="
  }
  return out
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "")
  const len = Math.floor((clean.length * 3) / 4)
  const out = new Uint8Array(len)
  let p = 0
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]!)
    const c1 = B64.indexOf(clean[i + 1]!)
    const c2 = B64.indexOf(clean[i + 2]!)
    const c3 = B64.indexOf(clean[i + 3]!)
    if (p < len) out[p++] = (c0 << 2) | (c1 >> 4)
    if (p < len && c2 >= 0) out[p++] = ((c1 & 15) << 4) | (c2 >> 2)
    if (p < len && c3 >= 0) out[p++] = ((c2 & 3) << 6) | c3
  }
  return out
}

/** Generate a fresh random salt (base64). Call ONCE per user; store in Convex. */
export function generateSalt(): string {
  const salt = new Uint8Array(SALT_BYTES)
  getCrypto().getRandomValues(salt)
  return bytesToBase64(salt)
}

/**
 * Derive the per-user AES-GCM master key from the master/vault passphrase and
 * the user's salt. Run once per session on unlock; keep the returned CryptoKey
 * in memory. The key is non-extractable.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string,
): Promise<CryptoKey> {
  const { subtle } = getCrypto()
  const baseKey = await subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    AES_KEY_BITS,
  )
  return subtle.importKey("raw", bits, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ])
}

/** Encrypt a UTF-8 string. A fresh random IV is generated on every call. */
export async function encryptData(
  plainText: string,
  key: CryptoKey,
): Promise<EncryptedDataPackage> {
  const provider = getCrypto()
  // Keep our own reference rather than relying on the return value — some
  // `getRandomValues` implementations fill in place and return void.
  const iv = new Uint8Array(IV_BYTES)
  provider.getRandomValues(iv)
  const cipher = await provider.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText),
  )
  return {
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
    iv: bytesToBase64(iv),
  }
}

/** Decrypt back to the original UTF-8 string. Throws if the tag fails (tamper). */
export async function decryptData(
  ciphertext: string,
  iv: string,
  key: CryptoKey,
): Promise<string> {
  const { subtle } = getCrypto()
  const plain = await subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  )
  return decoder.decode(plain)
}
