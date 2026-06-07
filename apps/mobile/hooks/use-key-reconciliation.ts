import { useEffect, useRef } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { wrapDekForRecipients } from "@/lib/asset-crypto"
import { useMasterKey } from "@/stores/vault"

type WrapEntry = {
  assetId: Id<"assets">
  beneficiaryId: Id<"beneficiaries">
  wrappedKey: string
  algorithm: string
  keyFingerprint: string
}

/**
 * Drains beneficiary key-wrap gaps while the vault is unlocked. The owner's device
 * is the ONLY place a DEK exists in plaintext, so this client loop is the sole
 * producer of `wrappedKeys`: read a page of gaps, unwrap each DEK under the master
 * key, RSA-wrap it to each beneficiary's public key, save, and let the reactive
 * `listWrapGaps` surface the next page until none remain. New assets and newly
 * enrolled beneficiaries become gaps automatically, so they get wrapped too.
 *
 * Idempotent + self-healing: `saveWrappedKeys` skips existing pairs, and a failed
 * page simply leaves gaps for a later unlock — nothing is ever half-written wrong.
 * Mount once on a screen that requires unlock (the Vault tab). Renders nothing.
 */
export function useKeyReconciliation() {
  const masterKey = useMasterKey()
  const gaps = useQuery(api.wrappedKeys.listWrapGaps, masterKey ? {} : "skip")
  const saveWrappedKeys = useMutation(api.wrappedKeys.saveWrappedKeys)
  const running = useRef(false)

  useEffect(() => {
    if (!masterKey || !gaps || gaps.length === 0 || running.current) return
    running.current = true
    let cancelled = false
    void (async () => {
      try {
        // Group by asset so each DEK is unwrapped once, even when several
        // beneficiaries need the same asset.
        const byAsset = new Map<string, typeof gaps>()
        for (const g of gaps) {
          const arr = byAsset.get(g.assetId) ?? []
          arr.push(g)
          byAsset.set(g.assetId, arr)
        }
        const entries: WrapEntry[] = []
        for (const group of byAsset.values()) {
          const head = group[0]!
          const wraps = await wrapDekForRecipients(
            { ownerWrappedKey: head.ownerWrappedKey, ownerWrapIv: head.ownerWrapIv },
            masterKey,
            group.map((g) => ({ beneficiaryId: g.beneficiaryId, publicKey: g.publicKey }))
          )
          // wrapDekForRecipients preserves recipient order, so wraps[i] ↔ group[i].
          wraps.forEach((w, i) => {
            entries.push({
              assetId: group[i]!.assetId,
              beneficiaryId: group[i]!.beneficiaryId,
              wrappedKey: w.wrappedKey,
              algorithm: w.algorithm,
              keyFingerprint: w.keyFingerprint,
            })
          })
        }
        if (!cancelled && entries.length > 0) {
          await saveWrappedKeys({ entries })
        }
      } catch {
        // Best-effort: leave the remaining gaps for the next unlock to refill.
      } finally {
        running.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [masterKey, gaps, saveWrappedKeys])
}
