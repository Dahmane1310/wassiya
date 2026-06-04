import {
  bytesToBase64,
  decryptBytes,
  decryptData,
  encryptBytes,
  encryptData,
  generateDataKeyBytes,
  importDataKey,
  unwrapKey,
  wrapKey,
  type EncryptedDataPackage,
} from "@workspace/crypto"

// Pure client-side asset crypto orchestration — no React / Zustand / Convex.
// Mirrors lib/vault.ts. Envelope encryption: every asset gets its own random
// Data Encryption Key (DEK); the DEK encrypts the JSON payload AND the optional
// file bytes; the DEK is then wrapped under the in-memory master key. The server
// only ever sees ciphertext + IVs + the wrapped DEK + the encrypted file blob.

export const ASSET_PAYLOAD_VERSION = 1 as const

export type AssetKind = "asset" | "debt"

export type AssetCategory =
  | "real_estate"
  | "bank_account"
  | "vehicle"
  | "cash"
  | "business"
  | "crypto"
  | "document"
  | "other"

/**
 * The full, fully-encrypted asset record. The server stores none of these
 * fields in the clear — the entire object is sealed under the per-asset DEK.
 * `v` is the only migration handle (payloads are server-opaque, so any future
 * shape change is reconciled client-side after decrypt).
 */
/** File metadata is also encrypted inside the payload — the server stores only
 *  the opaque blob + IV, never the filename or type. */
export type AssetFileMeta = {
  name: string
  mimeType: string | null
}

export type AssetPayload = {
  v: typeof ASSET_PAYLOAD_VERSION
  kind: AssetKind
  category: AssetCategory
  label: string
  value: number | null
  currency: string | null // ISO 4217
  notes: string | null
  file: AssetFileMeta | null
  createdAt: number
  updatedAt: number
}

/** The ciphertext parts the backend persists for one asset. */
export type EncryptedAssetParts = {
  payload: EncryptedDataPackage
  ownerWrappedKey: string
  ownerWrapIv: string
  // The encrypted file (in-memory). The hook converts `ciphertext` to raw bytes
  // and uploads them to Convex storage; `iv` is stored on the row as `fileIv`.
  encryptedFile: EncryptedDataPackage | null
}

/** Just the fields `decryptAsset` needs — the payload + the wrapped DEK. */
export type EncryptedAssetRow = {
  payload: EncryptedDataPackage
  ownerWrappedKey: string
  ownerWrapIv: string
}

/**
 * Seal an asset for storage: mint a per-asset DEK, encrypt the JSON payload (and
 * optional file bytes) under it, then wrap the DEK under the master key. The
 * DEK's raw bytes are local and zeroed in `finally` before returning.
 */
export async function encryptAsset(
  payload: AssetPayload,
  fileBytes: Uint8Array<ArrayBuffer> | null,
  masterKey: CryptoKey,
): Promise<EncryptedAssetParts> {
  const rawDek = generateDataKeyBytes()
  try {
    const dek = await importDataKey(rawDek)
    const payloadEnc = await encryptData(JSON.stringify(payload), dek)
    const encryptedFile = fileBytes ? await encryptBytes(fileBytes, dek) : null
    const { wrappedKey, iv } = await wrapKey(rawDek, masterKey)
    return {
      payload: payloadEnc,
      ownerWrappedKey: wrappedKey,
      ownerWrapIv: iv,
      encryptedFile,
    }
  } finally {
    rawDek.fill(0)
  }
}

/**
 * Re-encrypt ONLY the payload under an asset's EXISTING DEK (stable-DEK edit).
 * Used for payload-only edits when the attached file is kept: rotating the DEK
 * would orphan the file (encrypted under the old DEK) and, later, invalidate any
 * beneficiary key-wraps. Keeps `ownerWrappedKey` / `ownerWrapIv` unchanged.
 */
export async function reencryptPayload(
  payload: AssetPayload,
  ownerWrappedKey: string,
  ownerWrapIv: string,
  masterKey: CryptoKey,
): Promise<EncryptedDataPackage> {
  const rawDek = await unwrapKey(ownerWrappedKey, ownerWrapIv, masterKey)
  try {
    const dek = await importDataKey(rawDek)
    return await encryptData(JSON.stringify(payload), dek)
  } finally {
    rawDek.fill(0)
  }
}

/**
 * Decrypt an asset's payload (cheap — used by list rows and the detail header).
 * Unwraps the DEK, decrypts the JSON, zeroes the raw DEK. The AES-GCM auth tag
 * throws on a wrong key or tampering.
 */
export async function decryptAsset(
  row: EncryptedAssetRow,
  masterKey: CryptoKey,
): Promise<AssetPayload> {
  const rawDek = await unwrapKey(row.ownerWrappedKey, row.ownerWrapIv, masterKey)
  try {
    const dek = await importDataKey(rawDek)
    const json = await decryptData(row.payload.ciphertext, row.payload.iv, dek)
    return JSON.parse(json) as AssetPayload
  } finally {
    rawDek.fill(0)
  }
}

/**
 * Decrypt an asset's attached file on demand (only the detail view calls this).
 * `encryptedBytes` are the raw cipher bytes fetched from Convex storage.
 */
export async function decryptAssetFile(
  encryptedBytes: Uint8Array<ArrayBuffer>,
  fileIv: string,
  ownerWrappedKey: string,
  ownerWrapIv: string,
  masterKey: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const rawDek = await unwrapKey(ownerWrappedKey, ownerWrapIv, masterKey)
  try {
    const dek = await importDataKey(rawDek)
    return await decryptBytes(bytesToBase64(encryptedBytes), fileIv, dek)
  } finally {
    rawDek.fill(0)
  }
}
