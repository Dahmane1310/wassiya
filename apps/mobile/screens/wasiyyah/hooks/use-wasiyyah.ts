import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { decryptLabel } from "@/lib/invite"
import { useMasterKey } from "@/stores/vault"

export type Allocation = {
  id: Id<"wasiyyahAllocations">
  beneficiaryId: Id<"beneficiaries">
  percentage: number
  name: string
}
export type AllocBeneficiary = { id: Id<"beneficiaries">; name: string }

/** Wasiyyah allocations joined to their beneficiaries (names decrypted on render).
 *  The ⅓ cap is enforced server-side in `setAllocation`. */
export function useWasiyyah() {
  const masterKey = useMasterKey()
  const allocationRows = useQuery(api.wasiyyah.listAllocations)
  const beneficiaryRows = useQuery(api.beneficiaries.listBeneficiaries)
  const setM = useMutation(api.wasiyyah.setAllocation)
  const removeM = useMutation(api.wasiyyah.removeAllocation)

  // beneficiaryId → display name (decrypted private label, else email)
  const [nameMap, setNameMap] = useState<Map<string, string> | null>(null)

  useEffect(() => {
    if (beneficiaryRows === undefined || !masterKey) {
      setNameMap(null)
      return
    }
    let active = true
    Promise.all(
      beneficiaryRows.map(async (b) => {
        let label: string | null = null
        if (b.label) {
          try {
            label = await decryptLabel(b.label, masterKey)
          } catch {
            label = null
          }
        }
        return [b._id as string, label?.trim() || b.contactEmail] as const
      })
    ).then((pairs) => active && setNameMap(new Map(pairs)))
    return () => {
      active = false
    }
  }, [beneficiaryRows, masterKey])

  // Candidates exclude heirs: a Wasiyyah bequest to a legal heir is invalid, and all
  // heirs are already beneficiaries. (nameMap keeps every beneficiary so existing
  // allocations still resolve a name.)
  const beneficiaries: AllocBeneficiary[] | null =
    beneficiaryRows === undefined || nameMap === null
      ? null
      : beneficiaryRows
          .filter((b) => !b.isHeir)
          .map((b) => ({ id: b._id, name: nameMap.get(b._id) ?? b.contactEmail }))

  const allocations: Allocation[] | null =
    allocationRows === undefined || nameMap === null
      ? null
      : allocationRows.map((a) => ({
          id: a._id,
          beneficiaryId: a.beneficiaryId,
          percentage: a.percentage,
          name: nameMap.get(a.beneficiaryId) ?? "—",
        }))

  async function setAllocation(beneficiaryId: Id<"beneficiaries">, percentage: number) {
    await setM({ beneficiaryId, percentage })
  }
  async function removeAllocation(id: Id<"wasiyyahAllocations">) {
    await removeM({ id })
  }

  return {
    allocations,
    beneficiaries,
    loading: allocations === null || beneficiaries === null,
    setAllocation,
    removeAllocation,
  }
}
