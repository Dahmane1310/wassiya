"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { useAdminSession } from "@/components/panel/admin-context"
import { DisableUserDialog } from "./disable-user-dialog"
import { EditNameDialog } from "./edit-name-dialog"
import { EnableUserButton } from "./enable-user-button"

type Props = {
  identity: {
    tokenIdentifier: string
    email: string | null
    name: string | null
    createdAt: string | null
    lastSignInAt: string | null
  }
  appUser: {
    onboardingComplete: boolean
    ownerGender: string | null
    createdAt: number
  } | null
  disabled: {
    disabledAt: number
    disabledBy: string
    reason: string | null
  } | null
}

function initialsOf(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?"
  const parts = source.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

/** Open page header (no card box): back link, large avatar + name + status,
 *  a quiet meta line, and the account actions on the end side. */
export function UserIdentityCard({ identity, appUser, disabled }: Props) {
  const { t } = useTranslation()
  const session = useAdminSession()
  const title = identity.name ?? identity.email ?? t("users.unknownUser")
  const subject = identity.tokenIdentifier.split("|").pop() ?? identity.tokenIdentifier
  const superadmin = session?.role === "superadmin"

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/users"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-[13px] font-medium transition-colors"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
        {t("users.backToUsers")}
      </Link>

      <Card className="py-0">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5">
          <div className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold tracking-tight">
            {initialsOf(identity.name, identity.email)}
          </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {disabled !== null ? (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive border-transparent">
                {t("users.disabledBadge")}
              </Badge>
            ) : appUser?.onboardingComplete ? (
              <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">
                {t("users.vaultSetUp")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {appUser === null ? t("users.noVault") : t("users.onboardingIncomplete")}
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            {identity.name !== null && identity.email !== null && (
              <span className="truncate">{identity.email}</span>
            )}
            {disabled !== null && (
              <span className="text-destructive">
                {t("users.disabledMeta", {
                  date: new Date(disabled.disabledAt).toLocaleDateString(),
                })}
                {disabled.reason !== null ? ` — ${disabled.reason}` : ""}
              </span>
            )}
          </div>
        </div>

          <div className="flex shrink-0 items-center gap-2">
            {disabled === null && (
              <EditNameDialog ownerId={subject} currentName={identity.name} />
            )}
            {superadmin &&
              (disabled !== null ? (
                <EnableUserButton ownerId={subject} />
              ) : (
                <DisableUserDialog ownerId={subject} />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
