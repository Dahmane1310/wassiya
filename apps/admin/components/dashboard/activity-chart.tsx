"use client"

import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { bucketByDay, mergeBuckets } from "@/lib/series"

export const RANGES = [14, 30, 90] as const
export type Range = (typeof RANGES)[number]

type Props = {
  checkIns: number[]
  newUsers: number[]
  capped: boolean
  range: Range
  onRangeChange: (r: Range) => void
}

/** Hero chart: daily check-ins (vault health pulse) vs new sign-ups. */
export function ActivityChart({ checkIns, newUsers, capped, range, onRangeChange }: Props) {
  const { t, i18n } = useTranslation()
  const data = mergeBuckets(
    bucketByDay(checkIns, range),
    bucketByDay(newUsers, range),
    "checkIns",
    "newUsers",
  )
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" })
  const config = {
    checkIns: { label: t("dashboard.seriesCheckIns"), color: "var(--chart-2)" },
    newUsers: { label: t("dashboard.seriesNewUsers"), color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">{t("dashboard.activityTitle")}</CardTitle>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t("dashboard.activitySub")}
            {capped ? ` · ${t("dashboard.capped")}` : ""}
          </p>
        </div>
        <Select value={String(range)} onValueChange={(v) => onRangeChange(Number(v) as Range)}>
          <SelectTrigger size="sm" className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {t("dashboard.rangeDays", { count: r })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fillCheckIns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillNewUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(v: string) => dayFmt.format(new Date(`${v}T00:00:00`))}
            />
            <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => dayFmt.format(new Date(`${String(v)}T00:00:00`))}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="newUsers"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#fillNewUsers)"
              stackId="a"
            />
            <Area
              dataKey="checkIns"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="url(#fillCheckIns)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
