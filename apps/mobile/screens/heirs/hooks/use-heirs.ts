import { useMutation, useQuery } from "convex/react"
import { type FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import type { Gender, Lineage, Relationship } from "@workspace/faraid"
import { encryptHeirName } from "@/lib/heir-crypto"
import { useMasterKey } from "@/stores/vault"

/** One row from `listFamilyMembers` (structural fields + encrypted name). */
export type HeirRow = FunctionReturnType<typeof api.familyMembers.listFamilyMembers>[number]

export type HeirDraft = {
  relationship: Relationship
  lineage?: Lineage
  gender: Gender
  name: string
}

/** Family-tree CRUD wired to the in-memory master key. The heir's name is
 *  encrypted on write (structural fields stay plaintext for the engine). */
export function useHeirs() {
  const rows = useQuery(api.familyMembers.listFamilyMembers)
  const masterKey = useMasterKey()
  const addMutation = useMutation(api.familyMembers.addFamilyMember)
  const updateMutation = useMutation(api.familyMembers.updateFamilyMember)
  const removeMutation = useMutation(api.familyMembers.removeFamilyMember)

  async function add(draft: HeirDraft): Promise<void> {
    if (!masterKey) throw new Error("Vault is locked")
    const name = await encryptHeirName(draft.name.trim(), masterKey)
    await addMutation({
      relationship: draft.relationship,
      lineage: draft.lineage,
      gender: draft.gender,
      isAlive: true,
      name,
    })
  }
  async function setAlive(id: Id<"familyMembers">, isAlive: boolean): Promise<void> {
    await updateMutation({ id, isAlive })
  }
  async function remove(id: Id<"familyMembers">): Promise<void> {
    await removeMutation({ id })
  }

  return { rows, add, setAlive, remove }
}
