"use client"

import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const STYLES: Record<string, { className: string }> = {
  active: { className: "bg-green-600/10 text-green-700 dark:text-green-400" },
  grace: { className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  pendingVerification: {
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  released: { className: "bg-blue-600/10 text-blue-700 dark:text-blue-400" },
  paused: { className: "bg-muted text-muted-foreground" },
}

/** Dead-man's-switch state badge. */
export function StateBadge({ state }: { state: string | null }) {
  const { t } = useTranslation()
  if (state === null) {
    return <Badge variant="outline" className="text-muted-foreground">{t("switchStates.noSwitch")}</Badge>
  }
  const s = STYLES[state] ?? { className: "bg-muted text-muted-foreground" }
  return (
    <Badge variant="secondary" className={cn("border-transparent", s.className)}>
      {t(`switchStates.${state}`, { defaultValue: state })}
    </Badge>
  )
}
