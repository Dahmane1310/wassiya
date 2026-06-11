"use client"

import { type LucideIcon } from "lucide-react"
import { Area, AreaChart } from "recharts"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ChartContainer } from "@workspace/ui/components/chart"
import { CountStat } from "@/components/shared/count-stat"
import { type DayBucket } from "@/lib/series"

type Props = {
  label: string
  count: { value: number; capped: boolean }
  icon: LucideIcon
  /** e.g. "+12 this week" */
  delta?: string
  /** Mini sparkline buckets (rendered axis-less behind the right edge). */
  spark?: DayBucket[]
  tone?: "default" | "warn" | "danger"
}

const TONES = {
  default: { tile: "bg-primary/10 text-primary", chart: "var(--chart-1)" },
  warn: {
    tile: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    chart: "var(--chart-3)",
  },
  danger: { tile: "bg-destructive/10 text-destructive", chart: "var(--destructive)" },
}

export function KpiCard({ label, count, icon: Icon, delta, spark, tone = "default" }: Props) {
  const t = TONES[tone]
  const id = label.replaceAll(/\W/g, "")
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="relative flex items-center gap-3 px-4 py-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${t.tile}`}>
          <Icon className="size-5" />
        </div>
        <div className="relative z-[1] min-w-0">
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            <CountStat count={count} />
          </div>
          <div className="text-muted-foreground truncate text-xs font-medium">{label}</div>
          {delta !== undefined && (
            <div className="text-primary mt-0.5 text-[11px] font-medium tabular-nums">
              {delta}
            </div>
          )}
        </div>
        {spark !== undefined && spark.some((b) => b.count > 0) && (
          <ChartContainer
            config={{ count: { color: t.chart } }}
            className="pointer-events-none absolute inset-y-3 end-0 z-0 aspect-auto w-2/5 opacity-70"
          >
            <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.chart} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={t.chart} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="count"
                type="monotone"
                stroke={t.chart}
                strokeWidth={1.5}
                fill={`url(#spark-${id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
