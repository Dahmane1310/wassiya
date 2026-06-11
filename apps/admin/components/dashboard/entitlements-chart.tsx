"use client"

import { useTranslation } from "react-i18next"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

type Counted = { value: number; capped: boolean }

type Props = {
  entitlements: {
    trialing: Counted
    active: Counted
    past_due: Counted
    canceled: Counted
    expired: Counted
  }
}

/** Horizontal bars of persisted entitlement rows by status. */
export function EntitlementsChart({ entitlements }: Props) {
  const { t } = useTranslation()
  const config = {
    trialing: { label: t("entStatus.trialing"), color: "var(--chart-1)" },
    active: { label: t("entStatus.active"), color: "var(--chart-2)" },
    past_due: { label: t("entStatus.past_due"), color: "var(--chart-3)" },
    canceled: { label: t("entStatus.canceled"), color: "var(--chart-4)" },
    expired: { label: t("entStatus.expired"), color: "var(--destructive)" },
  } satisfies ChartConfig

  const data = (Object.keys(config) as Array<keyof typeof config>).map((key) => ({
    status: key,
    count: entitlements[key].value,
    fill: `var(--color-${key})`,
  }))

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm">{t("dashboard.entitlementsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-52 w-full">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              axisLine={false}
              width={86}
              tickFormatter={(v: string) =>
                config[v as keyof typeof config]?.label as string
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={6} barSize={20}>
              <LabelList
                dataKey="count"
                position="right"
                className="fill-muted-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
