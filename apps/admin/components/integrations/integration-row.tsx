"use client"

import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

export type IntegrationStat = {
  value: string
  label: string
  /** "bad" tints the chip destructive (e.g. failed > 0). */
  tone?: "ok" | "bad"
}

type Props = {
  icon: LucideIcon
  /** Tile tint classes — gives each service its own hue. */
  tint: string
  name: string
  description: string
  configured: boolean
  /** Where the effective value comes from (panel beats env). */
  source?: "panel" | "env" | null
  /** Quiet status line under the description. */
  meta?: string
  /** Inline count chips (mono, tabular) after the meta. */
  stats?: IntegrationStat[]
  /** Action button(s) on the end side. */
  action?: ReactNode
}

/** One external service, settings-row style: tinted icon tile, name + status
 *  dot, description, meta + stat chips, actions. Full-bleed hover. */
export function IntegrationRow({
  icon: Icon,
  tint,
  name,
  description,
  configured,
  source,
  meta,
  stats,
  action,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className="group flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-secondary/30">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
          tint,
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold tracking-tight">{name}</span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              configured
                ? "text-green-700 dark:text-green-400"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                configured ? "bg-green-500" : "bg-muted-foreground/40",
              )}
            />
            {t(configured ? "integrations.connected" : "integrations.notConfigured")}
          </span>
          {configured && source != null && (
            <span className="text-muted-foreground text-xs">
              · {t(source === "panel" ? "integrations.viaPanel" : "integrations.viaEnv")}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 max-w-2xl text-[13px] leading-snug">
          {description}
        </p>
        {(meta !== undefined || (stats?.length ?? 0) > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {meta !== undefined && (
              <span className="text-muted-foreground text-xs">{meta}</span>
            )}
            {stats?.map((s) => (
              <span
                key={s.label}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
                  s.tone === "bad"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {s.value} {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {action != null && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  )
}
