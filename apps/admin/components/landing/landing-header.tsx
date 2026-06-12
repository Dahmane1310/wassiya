"use client"

import { type ReactNode } from "react"
import { type FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/api"
import { PublishDialog } from "./publish-dialog"

export type LandingContent = FunctionReturnType<
  typeof api.admin.landing.getLandingContent
>

/** Shared page header for every landing Content page: title on the start
 *  side; `extra` (e.g. the language select) + the global Publish action on
 *  the end side. */
export function LandingHeader({
  title,
  subtitle,
  content,
  extra,
}: {
  title: string
  subtitle: string
  content: LandingContent
  extra?: ReactNode
}) {
  const hasAnyDraft =
    content.en.draft !== null ||
    content.ar.draft !== null ||
    content.images.hasUnpublishedChanges

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <PublishDialog hasAnyDraft={hasAnyDraft} />
      </div>
    </div>
  )
}
