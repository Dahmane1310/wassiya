"use client"

import { Fragment } from "react"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { LangToggle } from "./lang-toggle"
import { NAV_GROUPS } from "./nav-items"
import { ThemeToggle } from "./theme-toggle"

function titleFor(pathname: string): string[] {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
      ) {
        // Detail routes (e.g. /users/<id>) get a second crumb.
        return pathname !== item.href && item.href !== "/"
          ? [item.titleKey, "common.detail"]
          : [item.titleKey]
      }
    }
  }
  return ["nav.brandSub"]
}

export function PanelHeader() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const crumbs = titleFor(pathname)
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ms-1.5" />
      <Separator orientation="vertical" className="me-1 mt-auto mb-auto !h-6" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            // Both are <li>s, so the separator must be a SIBLING of the item.
            <Fragment key={c}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={i < crumbs.length - 1 ? "text-muted-foreground" : ""}
                >
                  {t(c)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex items-center gap-1">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
