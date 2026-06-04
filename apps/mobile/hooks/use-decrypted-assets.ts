import { useEffect, useMemo, useState } from "react"
import { decryptAsset, type AssetPayload } from "@/lib/asset-crypto"
import {
  computeEstateSummary,
  type EstateSummary,
} from "@/lib/estate-summary"
import { useAssets, type AssetSummary } from "@/hooks/use-assets"
import { useMasterKey } from "@/stores/vault"

/** One row paired with its decrypted payload — `payload` is null when that row
 *  alone failed to decrypt (a corrupt/tampered record fails in isolation). */
export type DecryptedAsset = { row: AssetSummary; payload: AssetPayload | null }

/**
 * Decrypts the whole asset list ONCE at the screen level (not per row) so the
 * Vault tab can total the estate. PBKDF2 is never re-run — the master key is
 * already in memory — so this is just cheap per-asset AES-GCM unwraps, bounded
 * by the backend's `.take(200)`. Each row is caught individually, so one bad
 * record can't blank the list. The derived totals live entirely client-side.
 */
export function useDecryptedAssets(): {
  /** null until the first decrypt resolves; then one entry per asset row. */
  entries: DecryptedAsset[] | null
  summary: EstateSummary
  loading: boolean
} {
  const { assets } = useAssets()
  const masterKey = useMasterKey()
  const [entries, setEntries] = useState<DecryptedAsset[] | null>(null)

  useEffect(() => {
    if (assets === undefined || !masterKey) {
      setEntries(null)
      return
    }
    let active = true
    Promise.all(
      assets.map((row) =>
        decryptAsset(row, masterKey)
          .then((payload): DecryptedAsset => ({ row, payload }))
          .catch((): DecryptedAsset => ({ row, payload: null })),
      ),
      // Replace atomically; a superseded run is ignored so an edit mid-decrypt
      // can't write stale payloads. Prior entries stay on screen until the new
      // batch lands, so live-query updates don't flash the skeleton.
    ).then((next) => {
      if (active) setEntries(next)
    })
    return () => {
      active = false
    }
  }, [assets, masterKey])

  const summary = useMemo(
    () =>
      computeEstateSummary(
        (entries ?? [])
          .map((e) => e.payload)
          .filter((p): p is AssetPayload => p !== null),
      ),
    [entries],
  )

  const loading = assets === undefined || !masterKey || entries === null
  return { entries, summary, loading }
}
