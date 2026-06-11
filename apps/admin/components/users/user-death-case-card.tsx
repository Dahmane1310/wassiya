"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { TimeCell } from "@/components/shared/time-cell"
import { DetailRow } from "./detail-row"

type DeathCase = {
  status: string
  submittedByEmail: string | null
  reviewedAt: number | null
  reviewNotes: string | null
} | null

const TONES: Record<string, string> = {
  under_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
  rejected: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
}

const STATUS_KEYS: Record<string, string> = {
  under_review: "review.tabUnderReview",
  approved: "review.tabApproved",
  rejected: "review.tabRejected",
}

/** Only renders when a report exists — an empty card is noise. */
export function UserDeathCaseCard({ deathCase }: { deathCase: DeathCase }) {
  const { t } = useTranslation()
  if (deathCase === null) return null
  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userDeath.title")}</CardTitle>
        <Badge
          variant="secondary"
          className={`border-transparent capitalize ${TONES[deathCase.status] ?? ""}`}
        >
          {STATUS_KEYS[deathCase.status] !== undefined
            ? t(STATUS_KEYS[deathCase.status]!)
            : deathCase.status.replace("_", " ")}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="divide-border/50 divide-y">
          <DetailRow label={t("userDeath.reportedBy")}>
            <span className="truncate">{deathCase.submittedByEmail ?? "—"}</span>
          </DetailRow>
          {deathCase.reviewedAt !== null && (
            <DetailRow label={t("userDeath.decided")}>
              <TimeCell ts={deathCase.reviewedAt} />
            </DetailRow>
          )}
        </div>
        {deathCase.reviewNotes !== null && (
          <div className="bg-muted/40 rounded-lg border p-2.5 text-xs leading-relaxed">
            {deathCase.reviewNotes}
          </div>
        )}
        <Link
          href="/review"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("userDeath.openInReview")} <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </CardContent>
    </Card>
  )
}
