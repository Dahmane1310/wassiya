"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { LogOut, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { InitialsAvatar } from "../ui/initials-avatar"

function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (email[0] ?? "?").toUpperCase()
}

/** Avatar dropdown in the top nav. */
export function UserMenu() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t("common.you")
  const email = user?.email ?? ""
  const initials = initialsOf(name, email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Avatar-only trigger — name/email live inside the dropdown. */}
        <button
          type="button"
          aria-label={name}
          className="press hover:ring-border flex size-10 items-center justify-center rounded-full transition-shadow hover:ring-2 aria-expanded:ring-2 aria-expanded:ring-[var(--line)]"
        >
          <InitialsAvatar initials={initials} size={34} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5">
          <InitialsAvatar initials={initials} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{name}</span>
            <span className="text-muted-foreground block truncate text-xs font-normal">
              {email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* "My key" lives in the main nav — no duplicate here. */}
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User />
          {t("nav.menuProfile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
