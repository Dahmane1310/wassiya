"use client"

import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { ChevronsUpDown, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { useAdminSession } from "./admin-context"

export function SidebarUserMenu() {
  const { t } = useTranslation()
  const session = useAdminSession()
  const { user, signOut } = useAuth()
  const email = session?.email ?? user?.email ?? t("common.signedIn")
  const role = session?.role ?? "admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-medium">{email}</span>
            <span className="text-muted-foreground truncate text-xs capitalize">
              {t(`roles.${role}`, { defaultValue: role })}
            </span>
          </div>
          <ChevronsUpDown className="ms-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-normal">{email}</span>
          <Badge variant="secondary" className="capitalize">
            {t(`roles.${role}`, { defaultValue: role })}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
