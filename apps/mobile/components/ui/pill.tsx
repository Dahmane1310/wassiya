import type * as React from "react"
import { View } from "react-native"
import type { LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

export type PillTone = "neutral" | "green" | "blue" | "gold" | "red"

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  neutral: { bg: "bg-surface-3", fg: "text-ink-2" },
  green: { bg: "bg-green-soft", fg: "text-green" },
  blue: { bg: "bg-primary-soft", fg: "text-primary" },
  gold: { bg: "bg-gold-soft", fg: "text-gold-deep" },
  red: { bg: "bg-red-soft", fg: "text-danger" },
}

/** Small rounded status chip (e.g. ARMED · AES-256 · 27 days). */
export function Pill({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode
  tone?: PillTone
  icon?: LucideIcon
  className?: string
}) {
  const t = TONES[tone]
  const { ar, body } = useBrandType()
  return (
    <View
      className={cn(
        "h-[26px] flex-row items-center gap-1 self-start rounded-full px-2.5",
        t.bg,
        className
      )}
    >
      {icon ? <Icon as={icon} size={13} className={t.fg} /> : null}
      <Text className={cn("text-xs", ar ? body : "font-sans-semibold", t.fg)}>{children}</Text>
    </View>
  )
}
