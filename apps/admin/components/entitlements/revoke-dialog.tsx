"use client"

import { useMutation } from "convex/react"
import { Ban } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

/** Revoke (expire) an owner's persisted entitlement — their vault goes read-only. */
export function RevokeDialog({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation()
  const revoke = useMutation(api.admin.entitlements.adminRevokeEntitlement)
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" className="text-destructive">
          <Ban /> {t("entitlements.revoke")}
        </Button>
      }
      title={t("entitlements.revokeTitle")}
      description={t("entitlements.revokeBody")}
      confirmLabel={t("entitlements.revoke")}
      destructive
      onConfirm={async () => {
        try {
          await revoke({ ownerId, status: "expired" })
          toast.success(t("entitlements.revoked"))
        } catch {
          toast.error(t("entitlements.revokeFailed"))
        }
      }}
    />
  )
}
