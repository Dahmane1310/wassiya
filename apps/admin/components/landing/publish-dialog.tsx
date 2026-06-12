"use client"

import { useMutation } from "convex/react"
import { Rocket } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

/** Publish all saved drafts to the live channel (+ deploy-hook rebuild). */
export function PublishDialog({ hasAnyDraft }: { hasAnyDraft: boolean }) {
  const { t } = useTranslation()
  const publish = useMutation(api.admin.landing.publishDrafts)

  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" disabled={!hasAnyDraft}>
          <Rocket /> {t("landing.publish")}
        </Button>
      }
      title={t("landing.publishTitle")}
      description={t("landing.publishBody")}
      confirmLabel={t("landing.publish")}
      onConfirm={async () => {
        try {
          await publish({})
          toast.success(t("landing.published"))
        } catch (e) {
          const msg = e instanceof Error ? e.message : ""
          toast.error(
            msg.includes("NO_DRAFT") ? t("landing.noDraft") : t("landing.publishFailed"),
          )
        }
      }}
    />
  )
}
