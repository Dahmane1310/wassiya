"use client"

import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AvatarPicker } from "./avatar-picker"

function initialsOf(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?"
  const parts = source.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

/** Identity strip: avatar + name/email on the start side, quiet stat columns
 *  on the end side. */
export function ProfileIdentityCard() {
  const { t } = useTranslation()
  const me = useQuery(api.admin.profile.getMyProfile)

  if (me === undefined) {
    return (
      <Card className="py-0">
        <CardContent className="flex items-center gap-4 px-6 py-5">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5">
        <AvatarPicker
          avatarUrl={me.avatarUrl}
          hasCustomAvatar={me.hasCustomAvatar}
          initials={initialsOf(me.name, me.email)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              {me.name ?? me.email ?? t("users.unknownUser")}
            </h2>
            <Badge variant="secondary" className="capitalize">
              {t(`roles.${me.role}`, { defaultValue: me.role })}
            </Badge>
          </div>
          {me.name !== null && me.email !== null && (
            <p className="text-muted-foreground mt-1 truncate text-[13px]">{me.email}</p>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-8 sm:flex">
          <Stat
            label={t("profile.statAdminSince")}
            value={new Date(me.adminSince).toLocaleDateString()}
          />
          <Stat
            label={t("profile.statLastSignIn")}
            value={
              me.lastSignInAt !== null
                ? new Date(me.lastSignInAt).toLocaleDateString()
                : "—"
            }
          />
          {me.addedBy !== null && me.addedBy !== "bootstrap" && (
            <Stat label={t("profile.statAddedBy")} value={me.addedBy} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
