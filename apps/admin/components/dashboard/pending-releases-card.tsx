"use client"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"

/** The five estates closest to release — longstop countdowns front and center. */
export function PendingReleasesCard() {
  const { t } = useTranslation()
  const { results, status } = usePaginatedQuery(
    api.admin.estates.listPendingRelease,
    {},
    { initialNumItems: 5 },
  )

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("dashboard.pendingReleases")}</CardTitle>
        <Link
          href="/releases"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("dashboard.allReleases")} <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent>
        {status === "LoadingFirstPage" ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : results.length === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-green-600" />
            {t("dashboard.noPendingReleases")}
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {results.slice(0, 5).map((r) => (
              <div
                key={r.ownerId}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <OwnerRef ownerId={r.ownerId} email={r.ownerEmail} />
                {r.longstopAt !== null ? (
                  <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <TimeCell ts={r.longstopAt} />
                  </span>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground shrink-0">
                    {t("releases.needsReview")}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
