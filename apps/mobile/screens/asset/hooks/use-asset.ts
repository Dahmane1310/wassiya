import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import {
  decryptAsset,
  decryptAssetFile,
  type AssetPayload,
} from "@/lib/asset-crypto"
import { downloadEncryptedBytes } from "@/lib/asset-file"
import { useMasterKey } from "@/stores/vault"

export type AssetDetail = {
  id: Id<"assets">
  payload: AssetPayload
  ownerWrappedKey: string
  ownerWrapIv: string
  storageId?: Id<"_storage">
  fileIv?: string
  fileUrl: string | null
  createdAt: number
}

export type AssetStatus = "loading" | "missing" | "error" | "ready"

/**
 * Load + decrypt a single asset for the detail / edit screens. Pass `undefined`
 * (create mode) to skip the query. `loadFile` lazily downloads + decrypts the
 * attached file only when the user opens it.
 */
export function useAsset(assetId: Id<"assets"> | undefined) {
  const masterKey = useMasterKey()
  const row = useQuery(api.assets.getAsset, assetId ? { assetId } : "skip")
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setFailed(false)
    if (row === undefined || row === null || !masterKey) {
      setAsset(null)
      return
    }
    decryptAsset(row, masterKey)
      .then((payload) => {
        if (!active) return
        setAsset({
          id: row._id,
          payload,
          ownerWrappedKey: row.ownerWrappedKey,
          ownerWrapIv: row.ownerWrapIv,
          storageId: row.storageId,
          fileIv: row.fileIv,
          fileUrl: row.fileUrl,
          createdAt: payload.createdAt,
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [row, masterKey])

  const status: AssetStatus =
    row === undefined
      ? "loading"
      : row === null
        ? "missing"
        : failed
          ? "error"
          : asset === null
            ? "loading"
            : "ready"

  /** Download + decrypt the attached file's bytes, or null if there is none. */
  async function loadFile(): Promise<Uint8Array<ArrayBuffer> | null> {
    if (!row || !row.fileUrl || !row.fileIv || !masterKey) {
      return null
    }
    const encrypted = await downloadEncryptedBytes(row.fileUrl)
    return decryptAssetFile(
      encrypted,
      row.fileIv,
      row.ownerWrappedKey,
      row.ownerWrapIv,
      masterKey,
    )
  }

  return { asset, status, loadFile }
}
