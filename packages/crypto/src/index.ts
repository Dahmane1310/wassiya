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
const DEK_KEY_BYTES = 32 // raw length of an AES-256 Data Encryption Key

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

export function bytesToBase64(bytes: Uint8Array): string {
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

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
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
 * A fresh random invite token (URL-safe base64url, 32 bytes of entropy). The RAW
 * token is shown to the owner once and shared out-of-band — it is NEVER persisted
 * server-side; only its `sha256` hash is stored (schema `invites.tokenHash`), so a
 * DB read can't reveal a redeemable token.
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(32)
  getCrypto().getRandomValues(bytes)
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/** SHA-256 of a string → base64. Hash the raw token on both ends (issue/redeem);
 *  the server compares hashes and never sees the token itself. */
export async function sha256(input: string): Promise<string> {
  const digest = await getCrypto().subtle.digest("SHA-256", encoder.encode(input))
  return bytesToBase64(new Uint8Array(digest))
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

// --- Envelope encryption (per-record Data Encryption Keys) ------------------
//
// Each vault record (e.g. an asset) is encrypted under its own random DEK, and
// the DEK is then "wrapped" (encrypted) under the in-memory master key. This
// indirection lets a record be re-shared to a beneficiary later — by wrapping
// the SAME DEK to their public key — without ever handing out the master key.
//
// We deliberately keep the DEK as RAW BYTES in the caller's hands and wrap it by
// encrypting those bytes under the master key. We never call `subtle.exportKey`
// or `subtle.wrapKey`: the master key is non-extractable with only
// `encrypt`/`decrypt` usages (see `deriveKeyFromPassword`), so `wrapKey` would
// throw, and `exportKey` is not reliably implemented across RN WebCrypto
// backends. `encrypt`/`decrypt` + `importKey("raw", …)` are the only primitives
// the existing unlock path already exercises.

// All byte params/returns are `Uint8Array<ArrayBuffer>` (not the looser
// `ArrayBufferLike`) — that's what WebCrypto's `BufferSource` requires, and what
// `base64ToBytes` / `new Uint8Array(n)` already produce, so the whole chain is
// copy-free.

/** Fresh raw bytes for a per-record Data Encryption Key (AES-256). */
export function generateDataKeyBytes(): Uint8Array<ArrayBuffer> {
  const raw = new Uint8Array(DEK_KEY_BYTES)
  getCrypto().getRandomValues(raw)
  return raw
}

/** Import raw DEK bytes as a non-extractable AES-GCM key (encrypt/decrypt). */
export async function importDataKey(
  raw: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  return getCrypto().subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ])
}

/** Encrypt raw bytes (e.g. a file). A fresh random IV is generated on every call. */
export async function encryptBytes(
  bytes: Uint8Array<ArrayBuffer>,
  key: CryptoKey,
): Promise<EncryptedDataPackage> {
  const provider = getCrypto()
  // Keep our own IV reference — some getRandomValues fill in place, return void.
  const iv = new Uint8Array(IV_BYTES)
  provider.getRandomValues(iv)
  const cipher = await provider.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes)
  return {
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
    iv: bytesToBase64(iv),
  }
}

/** Decrypt back to raw bytes. Throws if the auth tag fails (tamper/wrong key). */
export async function decryptBytes(
  ciphertext: string,
  iv: string,
  key: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const { subtle } = getCrypto()
  const plain = await subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  )
  return new Uint8Array(plain)
}

/**
 * Wrap a DEK by AES-GCM-encrypting its raw bytes under the wrapping key (the
 * master key). Returns base64 ciphertext + IV — store these as
 * `ownerWrappedKey` / `ownerWrapIv`. Zero `rawDek` afterwards at the call site.
 */
export async function wrapKey(
  rawDek: Uint8Array<ArrayBuffer>,
  wrappingKey: CryptoKey,
): Promise<{ wrappedKey: string; iv: string }> {
  const { ciphertext, iv } = await encryptBytes(rawDek, wrappingKey)
  return { wrappedKey: ciphertext, iv }
}

/**
 * Recover a DEK's raw bytes from its wrapped form. The caller imports them via
 * `importDataKey` and then zeroes the bytes.
 */
export async function unwrapKey(
  wrappedKey: string,
  iv: string,
  wrappingKey: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  return decryptBytes(wrappedKey, iv, wrappingKey)
}

// --- Asymmetric DEK wrapping (re-share a record to a beneficiary) ------------
//
// To make a record releasable to a beneficiary after death, the OWNER re-wraps
// that record's raw DEK bytes under the beneficiary's PUBLIC key. The beneficiary
// later unwraps with the private half they hold (release / onboarding slices).
//
// RSA-OAEP-256 directly encrypts the 32-byte DEK — no hybrid/ephemeral key, and
// (unlike AES-GCM) RSA-OAEP is randomized internally, so there is NO IV and no
// IV-reuse hazard. RSA-2048 OAEP-SHA256 fits ~190 plaintext bytes; 32 is ample.
// The public key travels as base64 SPKI; verify QuickCrypto supports RSA-OAEP
// importKey("spki")/encrypt on-device before relying on this.

/** Canonical wrap-algorithm tag stored alongside each wrapped key (schema
 *  `wrappedKeys.algorithm`) so the scheme can evolve without ambiguity. */
export const RSA_WRAP_ALGORITHM = "RSA-OAEP-256"

/** RSA modulus for generated recipient keypairs (onboarding/release slices). */
export const RSA_MODULUS_BITS = 2048

const RSA_OAEP_PARAMS = { name: "RSA-OAEP", hash: PBKDF2_HASH } as const

/** Import a beneficiary's base64 SPKI public key for RSA-OAEP encryption. */
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  return getCrypto().subtle.importKey(
    "spki",
    base64ToBytes(spkiBase64),
    RSA_OAEP_PARAMS,
    false,
    ["encrypt"],
  )
}

/**
 * Wrap raw DEK bytes to a beneficiary's public key (RSA-OAEP). Returns base64
 * ciphertext only — RSA-OAEP carries its own randomness, so there is no IV.
 * Zero `rawDek` at the call site afterwards.
 */
export async function wrapKeyForPublicKey(
  rawDek: Uint8Array<ArrayBuffer>,
  publicKey: CryptoKey,
): Promise<string> {
  const cipher = await getCrypto().subtle.encrypt(RSA_OAEP_PARAMS, publicKey, rawDek)
  return bytesToBase64(new Uint8Array(cipher))
}

/**
 * Stable fingerprint of a base64 SPKI public key (base64 SHA-256). Stored with
 * each wrapped key so a substituted key is detectable, and shown for out-of-band
 * verification ("does this fingerprint match what your beneficiary read to you?").
 */
export async function publicKeyFingerprint(spkiBase64: string): Promise<string> {
  const digest = await getCrypto().subtle.digest(
    "SHA-256",
    base64ToBytes(spkiBase64),
  )
  return bytesToBase64(new Uint8Array(digest))
}

/** Import a recipient's PKCS#8 private key (base64) for RSA-OAEP decryption — the
 *  release side. Recovered from the recovery-wrapped escrow, then used to unwrap
 *  each asset's DEK. */
export async function importPrivateKey(pkcs8Base64: string): Promise<CryptoKey> {
  return getCrypto().subtle.importKey(
    "pkcs8",
    base64ToBytes(pkcs8Base64),
    RSA_OAEP_PARAMS,
    false,
    ["decrypt"],
  )
}

/** Unwrap a DEK that was RSA-OAEP-wrapped to the recipient's public key (the
 *  inverse of `wrapKeyForPublicKey`). Returns raw DEK bytes — import via
 *  `importDataKey` and zero them after use. */
export async function unwrapDekWithPrivateKey(
  wrappedBase64: string,
  privateKey: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const plain = await getCrypto().subtle.decrypt(
    RSA_OAEP_PARAMS,
    privateKey,
    base64ToBytes(wrappedBase64),
  )
  return new Uint8Array(plain)
}

// --- Recipient (beneficiary) keypair + recovery escrow ----------------------
//
// A beneficiary enrolls an RSA-OAEP keypair. The owner wraps asset DEKs to the
// PUBLIC half (above); the beneficiary unwraps with the PRIVATE half at release.
// The private key must survive for YEARS until release, so it is NOT kept only on
// a device — it is wrapped under a high-entropy Recovery Code (like the owner's
// master key) and escrowed server-side. The server holds public key + recovery-
// wrapped private key + DEKs-wrapped-to-public-key and can brute-force none of it.

/** Generate an extractable RSA-OAEP keypair. Returns the public key as base64
 *  SPKI and the private key as raw PKCS#8 bytes (extractable so it can be recovery-
 *  wrapped). Zero the returned `privateKey` once wrapped. */
export async function generateRecipientKeyPair(): Promise<{
  publicKey: string
  privateKey: Uint8Array<ArrayBuffer>
}> {
  const { subtle } = getCrypto()
  const pair = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: RSA_MODULUS_BITS,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: PBKDF2_HASH,
    },
    true,
    ["encrypt", "decrypt"],
  )
  const spki = new Uint8Array(await subtle.exportKey("spki", pair.publicKey))
  const pkcs8 = new Uint8Array(await subtle.exportKey("pkcs8", pair.privateKey))
  return { publicKey: bytesToBase64(spki), privateKey: pkcs8 }
}

/** The server-stored beneficiary keypair envelope (zero-knowledge): public key +
 *  its fingerprint + the recovery-wrapped private key. */
export interface RecipientEnrollment {
  publicKey: string // base64 SPKI — the owner wraps DEKs to this
  keyFingerprint: string // base64 SHA-256(spki) — out-of-band verification
  recoverySalt: string // PBKDF2 salt for the recovery-code-derived key
  wrappedPrivateKey: string // PKCS#8 private key, AES-GCM-wrapped under that key
  wrappedPrivateKeyIv: string
}

/**
 * Enroll a beneficiary: mint a keypair, mint a Recovery Code, and wrap the private
 * key under a key derived from that code. Returns the server-storable envelope plus
 * the Recovery Code, which is shown to the beneficiary ONCE and never persisted in
 * plaintext — losing it means an undecryptable share, so the UI must stress saving
 * it (mirror of the owner's vault recovery flow). The raw private key is zeroed.
 */
export async function enrollRecipient(): Promise<{
  enrollment: RecipientEnrollment
  recoveryCode: string
}> {
  const { publicKey, privateKey } = await generateRecipientKeyPair()
  try {
    const recoveryCode = generateRecoveryCode()
    const recoverySalt = generateSalt()
    const recKey = await deriveKeyFromPassword(
      normalizeRecoveryCode(recoveryCode),
      recoverySalt,
    )
    const { wrappedKey, iv } = await wrapKey(privateKey, recKey)
    return {
      enrollment: {
        publicKey,
        keyFingerprint: await publicKeyFingerprint(publicKey),
        recoverySalt,
        wrappedPrivateKey: wrappedKey,
        wrappedPrivateKeyIv: iv,
      },
      recoveryCode,
    }
  } finally {
    privateKey.fill(0)
  }
}

// Crockford base32 (no I/L/O/U — avoids transcription ambiguity). Recovery Codes
// are rendered in this alphabet and normalised back through it before derivation.
// Shared by the owner vault (mobile) and beneficiary enrollment (web).
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

function base32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31]
  return out
}

/**
 * Generate a high-entropy Recovery Code (160 bits) as five dash-separated groups,
 * e.g. `4K7Q8-MN2VP-...`. Entropy comes from the CSPRNG; grouping/case is just
 * presentation — `normalizeRecoveryCode` strips it before key derivation.
 */
export function generateRecoveryCode(): string {
  const raw = generateDataKeyBytes().slice(0, 20) // 160 bits → 32 symbols
  const sym = base32(raw)
  return (sym.match(/.{1,5}/g) ?? [sym]).join("-")
}

/**
 * Canonicalise a Recovery Code for PBKDF2 — applied IDENTICALLY on generation and
 * re-entry, or the derived key won't match. Upper-cases, drops separators, and
 * folds common confusables (O→0, I/L→1) into the canonical alphabet.
 */
export function normalizeRecoveryCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
}
