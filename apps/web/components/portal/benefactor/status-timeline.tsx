"use client"

import { Check } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export type TimelineStep = { done: boolean; label: string; when: string }

/** Vertical progress timeline on the benefactor detail page. */
export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative">
      {steps.map((t, i) => (
        <div key={i} className={cn("flex gap-3.5", i < steps.length - 1 && "pb-4.5")}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                t.done
                  ? "bg-green-soft text-green"
                  : "bg-secondary text-muted-foreground border-[1.5px] border-dashed",
              )}
            >
              {t.done ? (
                <Check className="size-3.5" strokeWidth={2.6} />
              ) : (
                <span className="bg-muted-foreground size-1 rounded-full" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mt-0.5 min-h-4.5 w-0.5 flex-1",
                  t.done ? "bg-green-soft" : "bg-[var(--line-2)]",
                )}
              />
            )}
          </div>
          <div className="pt-px">
            <div
              className={cn(
                "text-sm font-semibold",
                t.done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
            </div>
            {t.when && (
              <div className="text-muted-foreground mt-px text-xs">{t.when}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
