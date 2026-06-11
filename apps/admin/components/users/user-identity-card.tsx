"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

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
}

function initialsOf(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?"
  const parts = source.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function UserIdentityCard({ identity, appUser }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const title = identity.name ?? identity.email ?? t("users.unknownUser")
  const subject = identity.tokenIdentifier.split("|").pop() ?? identity.tokenIdentifier

  return (
    <Card className="py-0">
      <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-6">
        <Button asChild variant="ghost" size="icon" className="text-muted-foreground -ms-1.5 size-8 shrink-0">
          <Link href="/users" aria-label={t("users.backToUsers")}>
            <ChevronLeft className="size-4.5 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="bg-primary/10 text-primary flex size-13 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold tracking-tight">
          {initialsOf(identity.name, identity.email)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {identity.name !== null && identity.email !== null && (
              <span>{identity.email}</span>
            )}
            <button
              type="button"
              className="hover:text-foreground inline-flex items-center gap-1 font-mono transition-colors"
              title={identity.tokenIdentifier}
              onClick={() => {
                void navigator.clipboard?.writeText(identity.tokenIdentifier)
                setCopied(true)
                setTimeout(() => setCopied(false), 1200)
              }}
            >
              {subject}
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
            {identity.lastSignInAt !== null && (
              <span>
                {t("users.lastSignIn", {
                  date: new Date(identity.lastSignInAt).toLocaleDateString(),
                })}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {appUser?.onboardingComplete ? (
            <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">
              {t("users.vaultSetUp")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {appUser === null ? t("users.noVault") : t("users.onboardingIncomplete")}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
