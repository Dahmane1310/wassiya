import { type ReactNode } from "react"

/** One label/value line inside a detail card — wrap a stack of these in
 *  `divide-y divide-border/50` for the shared card row language. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 text-end font-medium">{children}</span>
    </div>
  )
}
