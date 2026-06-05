import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { decryptLabel, encryptLabel, newInvite } from "@/lib/invite"
import { useMasterKey } from "@/stores/vault"

export type ExecutorScope = "full" | "debts_only" | "attest_only" | "coordinate"

export type Beneficiary = {
  id: Id<"beneficiaries">
  contactEmail: string
  enrolled: boolean
  linked: boolean
  label: string | null
}
export type Executor = {
  id: Id<"executors">
  contactEmail: string
  scope: ExecutorScope
  linked: boolean
  label: string | null
}

/** Beneficiary + executor management, wired to Convex. Private labels are
 *  encrypted on write and decrypted on render. Invite tokens are generated +
 *  hashed on-device; only the hash is stored, the raw token is returned to share. */
export function useContacts() {
  const masterKey = useMasterKey()
  const beneficiaryRows = useQuery(api.beneficiaries.listBeneficiaries)
  const executorRows = useQuery(api.executors.listExecutors)

  const addBeneficiaryM = useMutation(api.beneficiaries.addBeneficiary)
  const removeBeneficiaryM = useMutation(api.beneficiaries.removeBeneficiary)
  const addExecutorM = useMutation(api.executors.addExecutor)
  const removeExecutorM = useMutation(api.executors.removeExecutor)
  const issueInviteM = useMutation(api.invites.issueInvite)

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null)
  const [executors, setExecutors] = useState<Executor[] | null>(null)

  useEffect(() => {
    if (beneficiaryRows === undefined || !masterKey) {
      setBeneficiaries(null)
      return
    }
    let active = true
    Promise.all(
      beneficiaryRows.map(async (r): Promise<Beneficiary> => {
        let label: string | null = null
        if (r.label) {
          try {
            label = await decryptLabel(r.label, masterKey)
          } catch {
            label = null
          }
        }
        return {
          id: r._id,
          contactEmail: r.contactEmail,
          enrolled: r.enrolled,
          linked: r.linkedUserId != null,
          label,
        }
      })
    ).then((next) => active && setBeneficiaries(next))
    return () => {
      active = false
    }
  }, [beneficiaryRows, masterKey])

  useEffect(() => {
    if (executorRows === undefined || !masterKey) {
      setExecutors(null)
      return
    }
    let active = true
    Promise.all(
      executorRows.map(async (r): Promise<Executor> => {
        let label: string | null = null
        if (r.label) {
          try {
            label = await decryptLabel(r.label, masterKey)
          } catch {
            label = null
          }
        }
        return { id: r._id, contactEmail: r.contactEmail, scope: r.scope, linked: r.linkedUserId != null, label }
      })
    ).then((next) => active && setExecutors(next))
    return () => {
      active = false
    }
  }, [executorRows, masterKey])

  async function addBeneficiary(contactEmail: string, name: string) {
    if (!masterKey) throw new Error("Vault is locked")
    const label = name.trim() ? await encryptLabel(name.trim(), masterKey) : undefined
    await addBeneficiaryM({ contactEmail, label })
  }
  async function addExecutor(contactEmail: string, name: string, scope: ExecutorScope) {
    if (!masterKey) throw new Error("Vault is locked")
    const label = name.trim() ? await encryptLabel(name.trim(), masterKey) : undefined
    await addExecutorM({ contactEmail, scope, label })
  }
  async function removeBeneficiary(id: Id<"beneficiaries">) {
    await removeBeneficiaryM({ id })
  }
  async function removeExecutor(id: Id<"executors">) {
    await removeExecutorM({ id })
  }
  /** Issue an invite and return the RAW token (to share). */
  async function invite(kind: "beneficiary" | "executor", id: Id<"beneficiaries"> | Id<"executors">) {
    const { token, tokenHash, expiresAt } = await newInvite()
    await issueInviteM({
      kind,
      beneficiaryId: kind === "beneficiary" ? (id as Id<"beneficiaries">) : undefined,
      executorId: kind === "executor" ? (id as Id<"executors">) : undefined,
      tokenHash,
      expiresAt,
    })
    return token
  }

  return {
    beneficiaries,
    executors,
    loading: beneficiaries === null || executors === null,
    addBeneficiary,
    addExecutor,
    removeBeneficiary,
    removeExecutor,
    invite,
  }
}
