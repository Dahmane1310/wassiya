"use client"

import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { initialsOf } from "../format"
import { InitialsAvatar } from "../ui/initials-avatar"
import { Page } from "../ui/page"
import { SectionTitle } from "../ui/section-title"
import { PersonalCard } from "./personal-card"
import { SecurityCard } from "./security-card"

/** Profile — who you are and how you sign in. Key matter stays on /account. */
export function Profile() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t("common.you")
  const email = user?.email ?? ""

  return (
    <Page narrow className="pt-8.5">
      <SectionTitle sub={t("profile.sub")}>{t("profile.title")}</SectionTitle>

      <Card className="mb-4 py-0">
        <CardContent className="flex items-center gap-4 p-6">
          <InitialsAvatar initials={initialsOf(name)} size={56} />
          <div className="flex-1">
            <div className="text-[17px] font-bold">{name}</div>
            <div className="text-muted-foreground text-[13px] font-semibold">{email}</div>
          </div>
        </CardContent>
      </Card>

      <PersonalCard
        initialFirst={user?.firstName ?? ""}
        initialLast={user?.lastName ?? ""}
        email={email}
      />

      <SecurityCard />

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut /> {t("common.signOut")}
        </Button>
      </div>
      <div className="mt-3 text-center">
        <a
          href="mailto:support@wassiya.app"
          className="text-muted-foreground hover:text-primary text-[12.5px] font-semibold transition-colors"
        >
          {t("account.contactSupport")}
        </a>
      </div>
    </Page>
  )
}
