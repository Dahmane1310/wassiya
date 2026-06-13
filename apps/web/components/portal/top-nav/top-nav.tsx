"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { Wordmark } from "../logo"
import { LangToggle } from "./lang-toggle"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./user-menu"

// label is an i18n KEY (locales/*.json "nav" section).
const ITEMS = [
  { href: "/home", label: "nav.home" },
  { href: "/account", label: "nav.myKey" },
]

/** Portal header — same chrome as the landing nav (72px, 1180px container,
 *  background at 80% + blur, quiet text links). */
export function TopNav() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const active = (href: string) =>
    pathname === href || (href === "/home" && pathname.startsWith("/benefactor"))

  return (
    <header className="bg-background/80 sticky top-0 z-50 shrink-0 border-b backdrop-blur-md">
      <div className="mx-auto grid h-[72px] max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="flex items-center">
          <button
            type="button"
            className="press flex items-center gap-2.5"
            onClick={() => router.push("/home")}
          >
            <Wordmark size={38} />
            <span className="bg-gold-soft text-gold-deep rounded-md px-2 py-0.5 text-[10.5px] font-extrabold tracking-wider uppercase">
              {t("nav.beneficiary")}
            </span>
          </button>
        </div>

        <nav className="flex items-center gap-1">
          {ITEMS.map((it) => (
            <button
              key={it.href}
              type="button"
              onClick={() => router.push(it.href)}
              className={cn(
                "press h-9.5 rounded-xl px-3.5 text-sm font-semibold transition-colors",
                active(it.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t(it.label)}
            </button>
          ))}
        </nav>

        {/* Same rhythm as the landing nav: language · theme · avatar. */}
        <div className="flex items-center justify-end gap-1.5">
          <LangToggle />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
