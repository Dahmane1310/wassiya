import { randomUUID } from "expo-crypto"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { base64ToBytes, bytesToBase64 } from "@workspace/crypto"
import { withoutAutoLock } from "@/lib/auto-lock"

// Device file I/O for encrypted asset attachments. Uses the stable legacy
// expo-file-system API (file-based upload/download is far more reliable than
// in-memory binary fetch on React Native). Plaintext bytes only ever touch a
// transient, app-sandboxed cache file that is deleted immediately after use.

const cacheDir = FileSystem.cacheDirectory ?? ""

function cachePath(suffix: string): string {
  return `${cacheDir}${randomUUID()}-${suffix}`
}

/** Read a picked file (file:// URI) into raw bytes for encryption. */
export async function readFileAsBytes(
  uri: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return base64ToBytes(base64)
}

/** Write bytes to a unique cache file; returns its file:// URI. */
export async function writeBytesToCache(
  bytes: Uint8Array<ArrayBuffer>,
  name: string,
): Promise<string> {
  const uri = cachePath(name)
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  })
  return uri
}

/** Delete a cache file (best-effort; never throws on a missing file). */
export async function deleteCacheFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true })
}

/**
 * Upload already-ENCRYPTED bytes to a Convex upload URL via a temp file, then
 * delete the temp. Returns the new storageId. Only ciphertext is ever written
 * or uploaded.
 */
export async function uploadEncryptedBytes(
  uploadUrl: string,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const tempUri = await writeBytesToCache(bytes, "upload.bin")
  try {
    const res = await FileSystem.uploadAsync(uploadUrl, tempUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    })
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Upload failed (${res.status})`)
    }
    const { storageId } = JSON.parse(res.body) as { storageId: string }
    return storageId
  } finally {
    await deleteCacheFile(tempUri)
  }
}

/** Download ENCRYPTED bytes from a signed URL via a temp file (robust binary). */
export async function downloadEncryptedBytes(
  url: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const tempUri = cachePath("download.bin")
  try {
    await FileSystem.downloadAsync(url, tempUri)
    const base64 = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return base64ToBytes(base64)
  } finally {
    await deleteCacheFile(tempUri)
  }
}

/**
 * Open DECRYPTED bytes in the OS viewer / share sheet. Writes a transient cache
 * file, shares it, then deletes it on dismiss. A deliberate, scoped plaintext
 * exception — sandboxed and never left on disk.
 */
export async function openDecryptedFile(
  bytes: Uint8Array<ArrayBuffer>,
  name: string,
  mimeType: string | undefined,
): Promise<void> {
  const uri = await writeBytesToCache(bytes, name)
  try {
    if (await Sharing.isAvailableAsync()) {
      // Suppress auto-lock: the share sheet backgrounds the app.
      await withoutAutoLock(() => Sharing.shareAsync(uri, { mimeType }))
    }
  } finally {
    await deleteCacheFile(uri)
  }
}
