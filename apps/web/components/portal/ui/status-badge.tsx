"use client"

import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { TONE_BADGE, type Tone } from "./status"

type Props = {
  children?: ReactNode
  tone?: Tone
  icon?: LucideIcon
  dot?: boolean
  className?: string
}

/** Tone-tinted pill (status chips). Replaces the old hand-rolled Pill. */
export function StatusBadge({ children, tone = "neutral", icon: Icon, dot, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        TONE_BADGE[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="size-3.5" strokeWidth={2.4} />}
      {children}
    </span>
  )
}
