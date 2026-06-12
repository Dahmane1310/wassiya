"use client"

import { useMutation } from "convex/react"
import { RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

/** Superadmin-only re-enable: deletes the disable marker — same identity, so the
 *  vault is reachable again. The switch stays paused until support resumes it. */
export function EnableUserButton({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation()
  const enable = useMutation(api.admin.users.adminEnableUser)

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          <RotateCcw /> {t("users.enableAccount")}
        </Button>
      }
      title={t("users.enableTitle")}
      description={t("users.enableBody")}
      confirmLabel={t("users.enableConfirm")}
      onConfirm={async () => {
        try {
          await enable({ ownerId })
          toast.success(t("users.enabledToast"))
        } catch {
          toast.error(t("users.enableFailed"))
        }
      }}
    />
  )
}
