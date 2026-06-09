import { useEffect, useState } from "react"
import { type Id } from "@workspace/backend/dataModel"
import type { Gender, Lineage, Relationship } from "@workspace/faraid"
import { useHeirs } from "@/screens/heirs/hooks/use-heirs"
import { decryptHeirName } from "@/lib/heir-crypto"
import { useMasterKey } from "@/stores/vault"

/** A family member with its decrypted name (`name` is null if THIS row alone
 *  failed to decrypt). Structural fields feed the Fara'id engine directly. */
export type DecryptedHeir = {
  id: Id<"familyMembers">
  relationship: Relationship
  lineage: Lineage | null
  gender: Gender
  isAlive: boolean
  name: string | null
  /** The linked beneficiary (set when the heir has an email) — invitable + decrypts. */
  linkedBeneficiaryId: Id<"beneficiaries"> | null
}

/** Decrypts heir names on render (mirror of `useDecryptedAssets`). The structural
 *  fields don't need decryption — only the name is PII. */
export function useDecryptedHeirs() {
  const { rows, add, update, setAlive, remove } = useHeirs()
  const masterKey = useMasterKey()
  const [heirs, setHeirs] = useState<DecryptedHeir[] | null>(null)

  useEffect(() => {
    if (rows === undefined || !masterKey) {
      setHeirs(null)
      return
    }
    let active = true
    Promise.all(
      rows.map(async (r): Promise<DecryptedHeir> => {
        let name: string | null = null
        try {
          name = await decryptHeirName(r.name, masterKey)
        } catch {
          name = null
        }
        return {
          id: r._id,
          relationship: r.relationship,
          lineage: r.lineage,
          gender: r.gender,
          isAlive: r.isAlive,
          name,
          linkedBeneficiaryId: r.linkedBeneficiaryId,
        }
      })
    ).then((next) => {
      if (active) setHeirs(next)
    })
    return () => {
      active = false
    }
  }, [rows, masterKey])

  return {
    heirs,
    loading: rows === undefined || !masterKey || heirs === null,
    add,
    update,
    setAlive,
    remove,
  }
}
