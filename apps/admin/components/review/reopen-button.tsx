"use client"

import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

type Props = {
  caseId: Id<"deathVerification">
  released: boolean
  onDone: () => void
}

/** Move a decided case back to review. Impossible once the estate released. */
export function ReopenButton({ caseId, released, onDone }: Props) {
  const { t } = useTranslation()
  const reopen = useMutation(api.admin.deathCases.reopenDeathCase)

  if (released) {
    return (
      <p className="text-muted-foreground text-xs">
        {t("review.releasedNoReopen")}
      </p>
    )
  }

  return (
    <div className="flex justify-end">
      <ConfirmDialog
        trigger={<Button variant="outline">{t("review.reopen")}</Button>}
        title={t("review.reopenTitle")}
        description={t("review.reopenBody")}
        confirmLabel={t("review.reopen")}
        onConfirm={async () => {
          try {
            await reopen({ id: caseId })
            toast.success(t("review.reopened"))
            onDone()
          } catch {
            toast.error(t("review.reopenFailed"))
          }
        }}
      />
    </div>
  )
}
