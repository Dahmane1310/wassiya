"use client"

import { useTranslation } from "react-i18next"
import { TimeCell } from "@/components/shared/time-cell"
import { aliveSignal, type DeathCase } from "./death-case"

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 text-end font-medium">{children}</span>
    </div>
  )
}

/** Everything the reviewer must weigh, in one column beside the certificate. */
export function CaseFacts({ deathCase: c }: { deathCase: DeathCase }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2.5">
      <div className="divide-border/50 divide-y">
        <Fact label={t("review.colReportedBy")}>
          <span className="block truncate">
            {c.submittedByEmail ?? t("review.unknownSubmitter")}
          </span>
          {c.submitterRole !== null && (
            <span className="text-muted-foreground block text-xs font-normal">
              {c.submitterRole}
            </span>
          )}
        </Fact>
        <Fact label={t("review.colSubmitted")}>
          <TimeCell ts={c.submittedAt} />
        </Fact>
        {c.dateOfDeath !== null && (
          <Fact label={t("review.rowDateOfDeath")}>
            {new Date(c.dateOfDeath).toLocaleDateString()}
          </Fact>
        )}
        {c.lastCheckInAt !== null && (
          <Fact label={t("review.rowLastCheckIn")}>
            {aliveSignal(c) ? (
              <span className="text-destructive font-medium">
                <TimeCell ts={c.lastCheckInAt} />
                <span className="block text-xs">{t("review.aliveSignal")}</span>
              </span>
            ) : (
              <TimeCell ts={c.lastCheckInAt} />
            )}
          </Fact>
        )}
        {c.reviewedBy !== null && (
          <Fact label={t("review.rowReviewedBy")}>
            <span className="font-mono text-xs">{c.reviewedBy.split("|").pop()}</span>
          </Fact>
        )}
        {c.reviewedAt !== null && (
          <Fact label={t("review.rowReviewed")}>
            <TimeCell ts={c.reviewedAt} />
          </Fact>
        )}
      </div>
      {c.reviewNotes !== null && (
        <div className="text-sm">
          <div className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">
            {t("review.reviewNotes")}
          </div>
          <div className="bg-muted/40 rounded-lg border p-2.5 text-sm leading-relaxed">
            {c.reviewNotes}
          </div>
        </div>
      )}
    </div>
  )
}
