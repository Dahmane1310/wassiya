"use client"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { TimeCell } from "@/components/shared/time-cell"
import { subjectOf } from "@/lib/owner-id"

/** Last few billing-ledger events for this owner (full ledger on /billing). */
export function UserBillingCard({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation()
  const { results, status } = usePaginatedQuery(
    api.admin.billing.listBillingEvents,
    { ownerId },
    { initialNumItems: 8 },
  )

  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userBilling.title")}</CardTitle>
        <Link
          href={`/billing?ownerId=${subjectOf(ownerId)}`}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {t("userBilling.fullLedger")} <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent>
        {status === "LoadingFirstPage" ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : results.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("userBilling.noEvents")}</p>
        ) : (
          <div className="divide-border/50 divide-y">
            {results.map((e) => (
              <div
                key={e._id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline">{e.type.replaceAll("_", " ")}</Badge>
                  {e.plan !== null && (
                    <span className="text-muted-foreground text-xs capitalize">{t(`plans.${e.plan}`, { defaultValue: e.plan })}</span>
                  )}
                </span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                  <span className="capitalize">{e.source}</span>
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
