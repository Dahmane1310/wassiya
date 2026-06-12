"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"

function initialsOf(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?"
  const parts = source.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

/** Header avatar → the profile page. Uploaded photo, else SSO photo, else initials. */
export function HeaderAvatar() {
  const { t } = useTranslation()
  const me = useQuery(api.admin.profile.getMyProfile)

  if (me === undefined) return <Skeleton className="size-8 rounded-full" />

  return (
    <Link
      href="/profile"
      aria-label={t("profile.title")}
      className="ms-1 transition-opacity hover:opacity-80"
    >
      {me.avatarUrl !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimizable
        <img src={me.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold tracking-tight">
          {initialsOf(me.name, me.email)}
        </div>
      )}
    </Link>
  )
}
