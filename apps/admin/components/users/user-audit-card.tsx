"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { EventBadge } from "@/components/audit/event-badge"
import { TimeCell } from "@/components/shared/time-cell"
import { subjectOf } from "@/lib/owner-id"

type Entry = {
  _id: string
  _creationTime: number
  actor: string
  event: string
}

export function UserAuditCard({ ownerId, entries }: { ownerId: string; entries: Entry[] }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userAudit.title")}</CardTitle>
        <Link
          href={`/audit?ownerId=${subjectOf(ownerId)}`}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("userAudit.fullLog")} <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("userAudit.noActivity")}</p>
        ) : (
          <div className="divide-border/50 divide-y">
            {entries.map((e) => (
              <div
                key={e._id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <EventBadge event={e.event} />
                <span className="text-muted-foreground flex shrink-0 items-center gap-2.5 text-xs">
                  {e.actor.startsWith("admin:") && (
                    <span className="text-primary font-medium">{t("userAudit.adminActor")}</span>
                  )}
                  {e.actor.startsWith("system") && <span>{t("userAudit.systemActor")}</span>}
                  <TimeCell ts={e._creationTime} />
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
