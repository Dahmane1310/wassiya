"use client"

import { type LucideIcon } from "lucide-react"

type Props = {
  icon: LucideIcon
  /** CSS color (token var) driving the tint. */
  tint?: string
  size?: number
  radius?: number
}

/** Tinted icon tile. Mixes against var(--card) so dark mode adapts. */
export function IconBadge({ icon: Icon, tint = "var(--primary)", size = 44, radius = 13 }: Props) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `color-mix(in oklch, ${tint} 12%, var(--card))`,
        color: tint,
      }}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.9} />
    </div>
  )
}
