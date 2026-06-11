"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { FileCheck, HeartPulse, MailWarning, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { bucketByDay, countLastDays } from "@/lib/series"
import { ActivityChart, type Range } from "./activity-chart"
import { AttentionList } from "./attention-list"
import { EntitlementsChart } from "./entitlements-chart"
import { KpiCard } from "./kpi-card"
import { LatestEvents } from "./latest-events"
import { PendingReleasesCard } from "./pending-releases-card"
import { SwitchDonut } from "./switch-donut"

const DAY_MS = 24 * 60 * 60 * 1000

export function DashboardScreen() {
  const { t } = useTranslation()
  const [range, setRange] = useState<Range>(30)
  // Recomputed only when the range changes — a per-render Date.now() would
  // re-subscribe the Convex query in a loop.
  const since = useMemo(() => Date.now() - range * DAY_MS, [range])

  const m = useQuery(api.admin.dashboard.getMetrics)
  const series = useQuery(api.admin.dashboard.getActivitySeries, { since })

  if (m === undefined || series === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-2xl xl:col-span-2" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const sparkDays = Math.min(range, 30)
  const attention = [
    ...(m.pendingLongstop.value > 0
      ? [{ label: t("dashboard.attnAutoRelease", { count: m.pendingLongstop.value }), href: "/releases" }]
      : []),
    ...(m.deathCases.under_review.value > 0
      ? [{ label: t("dashboard.attnReports", { count: m.deathCases.under_review.value }), href: "/review" }]
      : []),
    ...(m.switch.grace.value > 0
      ? [{ label: t("dashboard.attnGrace", { count: m.switch.grace.value }), href: "/users" }]
      : []),
    ...(m.notifications.failed.value > 0
      ? [{ label: t("dashboard.attnFailed", { count: m.notifications.failed.value }), href: "/notifications" }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.users")}
          count={m.users}
          icon={Users}
          delta={t("dashboard.thisWeek", { count: countLastDays(series.newUsers.ts, 7) })}
          spark={bucketByDay(series.newUsers.ts, sparkDays)}
        />
        <KpiCard
          label={t("dashboard.activeSwitches")}
          count={m.switch.active}
          icon={HeartPulse}
          delta={t("dashboard.checkInsThisWeek", { count: countLastDays(series.checkIns.ts, 7) })}
          spark={bucketByDay(series.checkIns.ts, sparkDays)}
        />
        <KpiCard
          label={t("dashboard.awaitingReview")}
          count={m.deathCases.under_review}
          icon={FileCheck}
          tone="warn"
          spark={bucketByDay(series.deathReports.ts, sparkDays)}
        />
        <KpiCard
          label={t("dashboard.failedNotifications")}
          count={m.notifications.failed}
          icon={MailWarning}
          tone={m.notifications.failed.value > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart
            checkIns={series.checkIns.ts}
            newUsers={series.newUsers.ts}
            capped={series.checkIns.capped || series.newUsers.capped}
            range={range}
            onRangeChange={setRange}
          />
        </div>
        <div className="flex flex-col gap-6">
          <SwitchDonut states={m.switch} />
          <AttentionList items={attention} />
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <EntitlementsChart entitlements={m.entitlements} />
        <LatestEvents />
        <PendingReleasesCard />
      </div>
    </div>
  )
}
