import { useMutation, useQuery } from "convex/react"
import { type FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { base64ToBytes, type EncryptedDataPackage } from "@workspace/crypto"
import {
  ASSET_PAYLOAD_VERSION,
  encryptAsset,
  reencryptPayload,
  type AssetCategory,
  type AssetFileMeta,
  type AssetKind,
  type AssetPayload,
} from "@/lib/asset-crypto"
import { readFileAsBytes, uploadEncryptedBytes } from "@/lib/asset-file"
import { useMasterKey } from "@/stores/vault"

/** One row from `listAssets` (kept in sync with the backend return type). */
export type AssetSummary = FunctionReturnType<typeof api.assets.listAssets>[number]

/** A file the user just picked (document or photo). */
export type PickedFile = {
  uri: string
  name: string
  mimeType?: string
  size?: number
}

/**
 * The form's attachment state. `existing` = an edit keeping the current file
 * (stable-DEK re-encrypt); `picked` = a new file to encrypt + upload; `none` =
 * no file / removed.
 */
export type Attachment =
  | { kind: "none" }
  | { kind: "existing"; name: string; mimeType: string | null }
  | { kind: "picked"; file: PickedFile }

/** The editable fields of an asset (everything but timestamps, version, file). */
export type AssetDraft = {
  kind: AssetKind
  category: AssetCategory
  label: string
  value: number | null
  currency: string | null
  notes: string | null
}

/** What an edit needs from the existing row to keep its DEK + file. */
export type ExistingAsset = {
  ownerWrappedKey: string
  ownerWrapIv: string
  storageId?: Id<"_storage">
  fileIv?: string
  createdAt: number
}

function attachmentMeta(a: Attachment): AssetFileMeta | null {
  if (a.kind === "picked") {
    return { name: a.file.name, mimeType: a.file.mimeType ?? null }
  }
  if (a.kind === "existing") {
    return { name: a.name, mimeType: a.mimeType }
  }
  return null
}

function buildPayload(
  draft: AssetDraft,
  file: AssetFileMeta | null,
  createdAt: number,
  updatedAt: number,
): AssetPayload {
  return {
    v: ASSET_PAYLOAD_VERSION,
    kind: draft.kind,
    category: draft.category,
    label: draft.label,
    value: draft.value,
    currency: draft.currency,
    notes: draft.notes,
    file,
    createdAt,
    updatedAt,
  }
}

/**
 * Asset CRUD wired to the in-memory master key. Encryption + (when a file is
 * attached) upload happen here; the list itself is decrypted on-render by each
 * row. PBKDF2 is never re-run — the master key is already in memory — so the
 * per-asset AES-GCM work is cheap.
 */
export function useAssets() {
  const masterKey = useMasterKey()
  const assets = useQuery(api.assets.listAssets)
  const createMutation = useMutation(api.assets.createAsset)
  const updateMutation = useMutation(api.assets.updateAsset)
  const deleteMutation = useMutation(api.assets.deleteAsset)
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)

  function requireKey(): CryptoKey {
    if (!masterKey) {
      throw new Error("Vault is locked")
    }
    return masterKey
  }

  async function uploadIfAny(
    encryptedFile: EncryptedDataPackage | null,
  ): Promise<{ storageId?: Id<"_storage">; fileIv?: string }> {
    if (!encryptedFile) {
      return { storageId: undefined, fileIv: undefined }
    }
    const url = await generateUploadUrl()
    const storageId = (await uploadEncryptedBytes(
      url,
      base64ToBytes(encryptedFile.ciphertext),
    )) as Id<"_storage">
    return { storageId, fileIv: encryptedFile.iv }
  }

  async function create(
    draft: AssetDraft,
    attachment: Attachment,
  ): Promise<void> {
    const key = requireKey()
    const now = Date.now()
    const payload = buildPayload(draft, attachmentMeta(attachment), now, now)
    const fileBytes =
      attachment.kind === "picked"
        ? await readFileAsBytes(attachment.file.uri)
        : null
    const enc = await encryptAsset(payload, fileBytes, key)
    const { storageId, fileIv } = await uploadIfAny(enc.encryptedFile)
    await createMutation({
      payload: enc.payload,
      ownerWrappedKey: enc.ownerWrappedKey,
      ownerWrapIv: enc.ownerWrapIv,
      storageId,
      fileIv,
    })
  }

  async function update(
    assetId: Id<"assets">,
    draft: AssetDraft,
    attachment: Attachment,
    existing: ExistingAsset,
  ): Promise<void> {
    const key = requireKey()
    const payload = buildPayload(
      draft,
      attachmentMeta(attachment),
      existing.createdAt,
      Date.now(),
    )
    if (attachment.kind === "existing") {
      // Keep the file → keep the DEK; re-encrypt only the payload.
      const payloadEnc = await reencryptPayload(
        payload,
        existing.ownerWrappedKey,
        existing.ownerWrapIv,
        key,
      )
      await updateMutation({
        assetId,
        payload: payloadEnc,
        ownerWrappedKey: existing.ownerWrappedKey,
        ownerWrapIv: existing.ownerWrapIv,
        storageId: existing.storageId,
        fileIv: existing.fileIv,
      })
      return
    }
    // Replaced or removed the file → fresh DEK; old blob is dropped server-side.
    const fileBytes =
      attachment.kind === "picked"
        ? await readFileAsBytes(attachment.file.uri)
        : null
    const enc = await encryptAsset(payload, fileBytes, key)
    const { storageId, fileIv } = await uploadIfAny(enc.encryptedFile)
    await updateMutation({
      assetId,
      payload: enc.payload,
      ownerWrappedKey: enc.ownerWrappedKey,
      ownerWrapIv: enc.ownerWrapIv,
      storageId,
      fileIv,
    })
  }

  async function remove(assetId: Id<"assets">): Promise<void> {
    await deleteMutation({ assetId })
  }

  return { assets, create, update, remove }
}
