"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

type Props = {
  caseId: Id<"deathVerification">
  ownerEmail: string | null
  onDone: () => void
}

/** Approve / reject an under-review case. Approval authorizes release and is
 *  IRREVERSIBLE; rejection requires notes (enforced server-side too). */
export function DecisionForm({ caseId, ownerEmail, onDone }: Props) {
  const { t } = useTranslation()
  const review = useMutation(api.release.reviewDeathVerification)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  async function decide(decision: "approved" | "rejected") {
    setBusy(true)
    try {
      await review({ id: caseId, decision, notes: notes.trim() || undefined })
      toast.success(decision === "approved" ? t("review.approved") : t("review.rejected"))
      onDone()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      toast.error(
        msg.includes("ALREADY_REVIEWED")
          ? t("review.alreadyDecided")
          : msg.includes("OWNER_CHECKED_IN_SINCE")
            ? t("review.ownerCheckedIn")
            : t("review.decisionFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder={t("review.notesPlaceholder")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="bg-background resize-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="text-destructive"
          disabled={busy || notes.trim().length === 0}
          onClick={() => void decide("rejected")}
        >
          {t("review.reject")}
        </Button>
        <ConfirmDialog
          trigger={<Button disabled={busy}>{t("review.approveRelease")}</Button>}
          title={t("review.approveTitle")}
          description={t("review.approveBody", {
            owner: ownerEmail ?? t("review.thisOwner"),
          })}
          confirmLabel={t("review.approveRelease")}
          destructive
          onConfirm={() => decide("approved")}
        />
      </div>
    </div>
  )
}
