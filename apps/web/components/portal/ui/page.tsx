"use client"

import { type ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

/** Portal page container: centered column with the entrance fade. */
export function Page({
  children,
  narrow,
  className,
}: {
  children?: ReactNode
  /** 720px instead of the default 760px. */
  narrow?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-fade mx-auto w-full px-6 pt-10 pb-18",
        narrow ? "max-w-[720px]" : "max-w-[760px]",
        className,
      )}
    >
      {children}
    </div>
  )
}
