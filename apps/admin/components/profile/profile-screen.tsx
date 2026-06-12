"use client"

import { useTranslation } from "react-i18next"
import { ChangePasswordCard } from "./change-password-card"
import { PersonalCard } from "./personal-card"
import { ProfileIdentityCard } from "./profile-identity-card"

/** Full-width rows: identity, personal, security. */
export function ProfileScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("profile.subtitle")}</p>
      </div>
      <ProfileIdentityCard />
      <PersonalCard />
      <ChangePasswordCard />
    </div>
  )
}
