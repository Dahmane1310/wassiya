"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { KeyRound, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { initialsOf } from "../format"
import { PrivacyLink } from "../privacy-explainer"
import { InitialsAvatar } from "../ui/initials-avatar"
import { Page } from "../ui/page"
import { SectionTitle } from "../ui/section-title"
import { StatusBadge } from "../ui/status-badge"
import { KeyCards } from "./key-cards"
import { SetupKey } from "./setup-key"

/** "My Key" — key matter only. Profile features (name, password, sign out)
 *  live on /profile, reached from the avatar menu. */
export function Account() {
  const { t } = useTranslation()
  const status = useQuery(api.recipients.getMyRecipientStatus)
  const { user } = useAuth()
  const [showSetup, setShowSetup] = useState(false)
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t("common.you")
  const email = user?.email ?? ""
  const enrolled = status?.enrolled ?? false

  return (
    <Page narrow className="pt-8.5">
      <SectionTitle sub={t("account.sub")}>{t("account.title")}</SectionTitle>

      <Card className="mb-4 py-0">
        <CardContent className="flex items-center gap-4 p-6">
          <InitialsAvatar initials={initialsOf(name)} size={56} />
          <div className="flex-1">
            <div className="text-[17px] font-bold">{name}</div>
            <div className="text-muted-foreground text-[13px] font-semibold">{email}</div>
          </div>
          {enrolled ? (
            <StatusBadge tone="green" dot>
              {t("account.keyReady")}
            </StatusBadge>
          ) : (
            <StatusBadge tone="amber" dot>
              {t("account.notSetUp")}
            </StatusBadge>
          )}
        </CardContent>
      </Card>

      {enrolled ? (
        <KeyCards fingerprint={status?.keyFingerprint ?? null} />
      ) : (
        // No key yet (e.g. signed up without an invite): offer the same
        // wizard the invite flow uses — a later invite links instantly.
        <Card className="mb-4 py-0">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <div className="bg-amber-soft flex size-12 shrink-0 items-center justify-center rounded-2xl text-amber-700 dark:text-amber-400">
              <KeyRound className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-bold">{t("invite.setupTitle")}</div>
              <div className="text-muted-foreground mt-0.5 max-w-xl text-[13px] leading-normal">
                {t("invite.setupBody")}
              </div>
            </div>
            <Button size="lg" onClick={() => setShowSetup(true)}>
              <KeyRound /> {t("invite.setupButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {showSetup && <SetupKey onClose={() => setShowSetup(false)} />}

      <Card className="py-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-soft text-green flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Lock className="size-5.5" />
            </div>
            <div className="flex-1">
              <div className="text-[14.5px] font-bold">{t("account.privateTitle")}</div>
              <div className="text-muted-foreground mt-px text-[12.5px] leading-normal">
                {t("account.privateBody")}
              </div>
            </div>
          </div>
          <div className="mt-3.5">
            <PrivacyLink />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground mt-4.5 text-center text-[11.5px] font-semibold">
        {t("account.footerBrand")} · <span className="ar">وصية</span> ·{" "}
        {t("account.footerPortal")}
      </div>
    </Page>
  )
}
