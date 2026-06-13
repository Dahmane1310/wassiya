"use client"

import { File, LockOpen, TriangleAlert, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { relPast } from "../format"

/** Per-state action cards on the benefactor detail page. Copy is the vetted
 *  plain-language text, now served from the i18n catalogue. */

export function ReleasedCard({ onView }: { onView: () => void }) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4 border-[color-mix(in_oklch,var(--blue)_25%,var(--card))] py-0">
      <CardContent className="flex items-center gap-3.5 p-5.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--blue-soft)] text-[var(--blue)]">
          <LockOpen className="size-6" />
        </div>
        <div className="flex-1">
          <div className="text-[15.5px] font-bold">{t("benefactor.cards.releasedTitle")}</div>
          <div className="text-muted-foreground mt-0.5 text-[13px]">
            {t("benefactor.cards.releasedBody")}
          </div>
        </div>
        <Button size="lg" className="bg-[var(--blue)] text-white hover:bg-[var(--blue)]/90" onClick={onView}>
          <LockOpen /> {t("benefactor.cards.viewButton")}
        </Button>
      </CardContent>
    </Card>
  )
}

export function RejectedCard({
  submittedAt,
  reason,
  onResubmit,
}: {
  submittedAt: number | null
  reason: string | null
  onResubmit: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4 border-[color-mix(in_oklch,var(--destructive)_22%,var(--border))] bg-[color-mix(in_oklch,var(--red-soft)_60%,var(--card))] py-0">
      <CardContent className="p-5.5">
        <div className="flex items-start gap-3.5">
          <div className="bg-red-soft text-destructive flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <TriangleAlert className="size-5.5" />
          </div>
          <div className="flex-1">
            <div className="text-[15.5px] font-bold">
              {t("benefactor.cards.rejectedTitle")}
            </div>
            <div className="text-foreground/70 mt-0.5 text-[13px] leading-normal">
              {submittedAt
                ? t("benefactor.cards.rejectedBodyWithDate", { when: relPast(submittedAt) })
                : t("benefactor.cards.rejectedBody")}
            </div>
            {reason && (
              <div className="bg-card text-foreground/70 mt-2.5 rounded-xl border px-3 py-2.5 text-[13px] leading-normal">
                <span className="text-foreground font-bold">
                  {t("benefactor.cards.reviewerNote")}
                </span>
                {reason}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3.5">
          <Button size="lg" onClick={onResubmit}>
            <Upload /> {t("benefactor.cards.resubmitButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function UnderReviewCard({ submittedAt }: { submittedAt: number | null }) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4 py-0">
      <CardContent className="flex items-center gap-3.5 p-5.5">
        <div className="bg-gold-soft text-gold-deep flex size-12 shrink-0 items-center justify-center rounded-2xl">
          <File className="size-5.5" />
        </div>
        <div className="flex-1">
          <div className="text-[15.5px] font-bold">
            {t("benefactor.cards.underReviewTitle")}
          </div>
          <div className="text-foreground/70 mt-0.5 text-[13px] leading-normal">
            {submittedAt
              ? t("benefactor.cards.underReviewBodyWithDate", { when: relPast(submittedAt) })
              : t("benefactor.cards.underReviewBody")}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportCard({
  firstName,
  onReport,
}: {
  firstName: string
  onReport: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4 py-0">
      <CardContent className="p-5.5">
        <div className="flex items-start gap-3.5">
          <div className="bg-amber-soft flex size-12 shrink-0 items-center justify-center rounded-2xl text-amber-700 dark:text-amber-400">
            <File className="size-5.5" />
          </div>
          <div className="flex-1">
            <div className="text-[15.5px] font-bold">{t("benefactor.cards.reportTitle")}</div>
            <div className="text-foreground/70 mt-0.5 text-[13px] leading-normal">
              {t("benefactor.cards.reportBody", { firstName })}
            </div>
          </div>
        </div>
        <div className="mt-3.5">
          <Button size="lg" onClick={onReport}>
            <Upload /> {t("benefactor.cards.reportButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
