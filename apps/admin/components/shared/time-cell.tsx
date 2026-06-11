"use client"

import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

function rel(ts: number, t: TFunction): string {
  const diff = Date.now() - ts
  const abs = Math.abs(diff)
  const past = diff >= 0
  const MIN = 60_000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR
  if (abs < MIN) return t("time.justNow")
  if (abs < HOUR)
    return t(past ? "time.minutesAgo" : "time.minutesFromNow", {
      count: Math.floor(abs / MIN),
    })
  if (abs < DAY)
    return t(past ? "time.hoursAgo" : "time.hoursFromNow", {
      count: Math.floor(abs / HOUR),
    })
  return t(past ? "time.daysAgo" : "time.daysFromNow", {
    count: Math.floor(abs / DAY),
  })
}

/** Relative timestamp with the absolute date on hover. */
export function TimeCell({ ts }: { ts: number | null }) {
  const { t } = useTranslation()
  if (ts === null) return <span className="text-muted-foreground">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="whitespace-nowrap text-sm">{rel(ts, t)}</span>
      </TooltipTrigger>
      <TooltipContent>{new Date(ts).toLocaleString()}</TooltipContent>
    </Tooltip>
  )
}
