import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { useSwitch } from "@/hooks/use-switch"

/** One "finish your vault" step, derived from a real backend signal (never a
 *  hardcoded checklist). `key` maps to `vaultHome.setup.<key>` for the label. */
export type SetupItem = { key: string; done: boolean }

export type VaultSetup = {
  items: SetupItem[]
  doneCount: number
  total: number
  /** Fraction complete (0–1) — drives the EstateSummaryCard readiness ring. */
  completeness: number
  loading: boolean
}

/**
 * The vault's setup completeness, computed from the same backend queries the rest
 * of the app already uses (raw row counts + switch state) — so it needs NO master
 * key and stays correct while the vault is locked. Both the home readiness ring
 * and the SetupChecklist read from here, so they can never disagree.
 */
export function useVaultSetup(): VaultSetup {
  const assets = useQuery(api.assets.listAssets)
  const heirs = useQuery(api.familyMembers.listFamilyMembers)
  const sw = useSwitch()

  const loading = assets === undefined || heirs === undefined || sw.status === "loading"

  // "pin" is always done: reaching the home tab means the vault exists. The rest
  // are the meaningful next steps toward a release-ready estate.
  const items: SetupItem[] = [
    { key: "pin", done: true },
    { key: "asset", done: (assets?.length ?? 0) > 0 },
    { key: "heirs", done: (heirs?.length ?? 0) > 0 },
    { key: "switch", done: sw.status !== "unarmed" && sw.status !== "loading" },
  ]

  const doneCount = items.filter((i) => i.done).length
  return {
    items,
    doneCount,
    total: items.length,
    completeness: items.length === 0 ? 0 : doneCount / items.length,
    loading,
  }
}
