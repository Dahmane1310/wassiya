"use client"

import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  trialing: "bg-primary/10 text-primary",
  active: "bg-green-600/10 text-green-700 dark:text-green-400",
  past_due: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  canceled: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
}

/** Plan + status in one chip pair. */
export function EntitlementBadge({ plan, status }: { plan: string; status: string }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className="capitalize">{t(`plans.${plan}`, { defaultValue: plan })}</Badge>
      <Badge
        variant="secondary"
        className={cn(
          "border-transparent capitalize",
          STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        )}
      >
        {t(`entStatus.${status}`, { defaultValue: status })}
      </Badge>
    </span>
  )
}
