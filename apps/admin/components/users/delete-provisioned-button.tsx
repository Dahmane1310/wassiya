"use client"

import { useAction } from "convex/react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { useAdminSession } from "@/components/panel/admin-context"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

/** Superadmin-only cleanup for a stale invited account (provisioned, no vault yet).
 *  Deletes the WorkOS sign-in account too, so the email can be invited again. */
export function DeleteProvisionedButton({
  ownerId,
  email,
}: {
  ownerId: string
  email: string | null
}) {
  const { t } = useTranslation()
  const session = useAdminSession()
  const deleteAccount = useAction(api.admin.users.adminDeleteProvisionedAccount)
  if (session?.role !== "superadmin") return null

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 /> {t("users.deleteInvite")}
        </Button>
      }
      title={t("users.deleteInviteTitle")}
      description={t("users.deleteInviteBody", { email: email ?? "" })}
      confirmLabel={t("users.deleteInviteConfirm")}
      destructive
      onConfirm={async () => {
        try {
          await deleteAccount({ ownerId })
          toast.success(t("users.deleteInviteToast"))
        } catch {
          toast.error(t("users.deleteInviteFailed"))
        }
      }}
    />
  )
}
