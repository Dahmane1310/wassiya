"use client"

import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"

/** Sidebar footer: a plain sign-out. Profile lives behind the header avatar. */
export function SidebarSignOut() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  return (
    <SidebarMenuButton
      tooltip={t("common.signOut")}
      onClick={() => void signOut()}
    >
      <LogOut />
      <span>{t("common.signOut")}</span>
    </SidebarMenuButton>
  )
}
