"use client"

import { useTranslation } from "react-i18next"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

type Counted = { value: number; capped: boolean }

type Props = {
  states: {
    active: Counted
    grace: Counted
    pendingVerification: Counted
    released: Counted
    paused: Counted
  }
}

/** Donut of switch states with the fleet total in the center. */
export function SwitchDonut({ states }: Props) {
  const { t } = useTranslation()
  const config = {
    active: { label: t("switchStates.active"), color: "var(--chart-2)" },
    grace: { label: t("switchStates.grace"), color: "var(--chart-3)" },
    pendingVerification: {
      label: t("switchStates.pendingVerification"),
      color: "var(--destructive)",
    },
    released: { label: t("switchStates.released"), color: "var(--chart-5)" },
    paused: { label: t("switchStates.paused"), color: "var(--chart-4)" },
  } satisfies ChartConfig

  const data = (Object.keys(config) as Array<keyof typeof config>).map((key) => ({
    state: key,
    count: states[key].value,
    fill: `var(--color-${key})`,
  }))
  const total = data.reduce((s, d) => s + d.count, 0)
  const capped = Object.values(states).some((c) => c.capped)

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-sm">{t("dashboard.switchStatesTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <ChartContainer config={config} className="aspect-square h-44 w-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="state"
              innerRadius={52}
              outerRadius={72}
              strokeWidth={3}
              paddingAngle={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {total.toLocaleString()}
                        {capped ? "+" : ""}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 18}
                        className="fill-muted-foreground text-[10px]"
                      >
                        {t("dashboard.switchesTotal")}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1">
          {data.map((d) => (
            <div key={d.state} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: `var(--color-${d.state})` }}
              />
              <span className="text-muted-foreground truncate">
                {config[d.state as keyof typeof config].label}
              </span>
              <span className="ms-auto font-medium tabular-nums">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
