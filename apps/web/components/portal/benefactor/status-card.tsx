"use client"

import { type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"
import { IconBadge } from "../ui/icon-badge"
import { STATUS, TONE_COLOR, type StatusKey } from "../ui/status"

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-end">
      <div className="text-muted-foreground text-xs font-semibold">{label}</div>
      <div className="serif text-[17px] font-semibold">{value}</div>
    </div>
  )
}

/** Tone-tinted status summary at the top of the detail page. */
export function StatusCard({ status, stat }: { status: StatusKey; stat?: ReactNode }) {
  const { t } = useTranslation()
  const s = STATUS[status]
  const tone = TONE_COLOR[s.tone]
  return (
    <Card
      className="mb-4 py-0"
      style={{
        background: `color-mix(in oklch, ${tone} 5%, var(--card))`,
        borderColor: `color-mix(in oklch, ${tone} 18%, var(--border))`,
      }}
    >
      <CardContent className="flex items-center gap-3.5 p-5">
        <IconBadge icon={s.icon} tint={tone} size={44} />
        <div className="flex-1">
          <div className="text-[15px] font-bold">{t(s.label)}</div>
          <div className="text-foreground/70 mt-0.5 text-[13px]">{t(s.desc)}</div>
        </div>
        {stat}
      </CardContent>
    </Card>
  )
}
