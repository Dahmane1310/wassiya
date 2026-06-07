import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { decryptLabel, encryptLabel, newInvite } from "@/lib/invite"
import { useMasterKey } from "@/stores/vault"

export type Beneficiary = {
  id: Id<"beneficiaries">
  contactEmail: string
  enrolled: boolean
  linked: boolean
  label: string | null
}

/**
 * Non-heir beneficiary management, wired to Convex. Heirs are also beneficiaries but
 * are managed on the Heirs screen (auto-linked) — this list is the standalone
 * recipients (e.g. a charity for a Wasiyyah bequest), so heir-linked beneficiaries
 * (`isHeir`) are filtered out. Private labels are encrypted on write / decrypted on
 * render; invite tokens are generated + hashed on-device.
 */
export function useContacts() {
  const { t } = useTranslation()
  const masterKey = useMasterKey()
  const beneficiaryRows = useQuery(api.beneficiaries.listBeneficiaries)

  const addBeneficiaryM = useMutation(api.beneficiaries.addBeneficiary)
  const removeBeneficiaryM = useMutation(api.beneficiaries.removeBeneficiary)
  const issueInviteM = useMutation(api.invites.issueInvite)

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[] | null>(null)

  useEffect(() => {
    if (beneficiaryRows === undefined || !masterKey) {
      setBeneficiaries(null)
      return
    }
    let active = true
    Promise.all(
      beneficiaryRows
        .filter((r) => !r.isHeir)
        .map(async (r): Promise<Beneficiary> => {
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

  async function addBeneficiary(contactEmail: string, name: string) {
    if (!masterKey) throw new Error("Vault is locked")
    const label = name.trim() ? await encryptLabel(name.trim(), masterKey) : undefined
    await addBeneficiaryM({ contactEmail, label })
  }
  async function removeBeneficiary(id: Id<"beneficiaries">) {
    try {
      await removeBeneficiaryM({ id })
    } catch (err) {
      if (err instanceof Error && err.message.includes("HAS_WASIYYAH_ALLOCATION")) {
        throw new Error(t("contacts.cantRemoveBeneficiary"))
      }
      throw err
    }
  }
  /** Issue an invite for a beneficiary and return the RAW token (to share). */
  async function invite(id: Id<"beneficiaries">) {
    const { token, tokenHash, expiresAt } = await newInvite()
    await issueInviteM({ beneficiaryId: id, tokenHash, expiresAt })
    return token
  }

  return {
    beneficiaries,
    loading: beneficiaries === null,
    addBeneficiary,
    removeBeneficiary,
    invite,
  }
}
