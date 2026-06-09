import { Share } from "react-native"
import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { withoutAutoLock } from "@/lib/auto-lock"
import { inviteLink, newInvite } from "@/lib/invite"

/**
 * Issue a beneficiary invite and share the link — used by both the Contacts
 * (non-heir recipients) and Heirs screens. The token is generated + hashed
 * on-device; only the hash reaches the server (`issueInvite`). Auto-lock is
 * suppressed while the OS share sheet is open. Works for any beneficiary id,
 * heir-linked or standalone.
 */
export function useInvite() {
  const { t } = useTranslation()
  const issueInvite = useMutation(api.invites.issueInvite)

  async function sendInvite(beneficiaryId: Id<"beneficiaries">, who: string) {
    const { token, tokenHash, expiresAt } = await newInvite()
    await issueInvite({ beneficiaryId, tokenHash, expiresAt })
    await withoutAutoLock(() =>
      Share.share({ message: t("contacts.inviteMessage", { who, link: inviteLink(token) }) })
    )
  }

  return { sendInvite }
}
