"use client"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { EventBadge } from "@/components/audit/event-badge"
import { TimeCell } from "@/components/shared/time-cell"

/** Live tail of the audit log — updates in place via Convex reactivity. */
export function LatestEvents() {
  const { t } = useTranslation()
  const { results, status } = usePaginatedQuery(
    api.admin.auditLog.listAuditLog,
    {},
    { initialNumItems: 8 },
  )

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("dashboard.latestEvents")}</CardTitle>
        <Link
          href="/audit"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("userAudit.fullLog")} <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent>
        {status === "LoadingFirstPage" ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : results.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("userAudit.noActivity")}</p>
        ) : (
          <div className="divide-border/50 divide-y">
            {results.slice(0, 8).map((e) => (
              <div
                key={e._id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <EventBadge event={e.event} />
                <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                  {e.actor.startsWith("admin:") && (
                    <span className="text-primary font-medium">{t("userAudit.adminActor")}</span>
                  )}
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
