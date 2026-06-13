"use client"

import { type ReactNode } from "react"

/** Section heading row: title + optional sub line + optional end-side slot. */
export function SectionTitle({
  children,
  sub,
  right,
}: {
  children?: ReactNode
  sub?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4.5 flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="serif text-[21px] leading-tight font-semibold tracking-tight">
          {children}
        </h2>
        {sub && <div className="text-muted-foreground mt-1 text-[13.5px]">{sub}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
