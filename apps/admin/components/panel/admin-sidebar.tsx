"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { type FunctionReturnType } from "convex/server"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"
import { useAdminSession } from "./admin-context"
import { useLang } from "./lang-provider"
import { Logo } from "./logo"
import { NAV_GROUPS, type NavItem } from "./nav-items"
import { SidebarSignOut } from "./sidebar-sign-out"

function badgeCount(
  badge: NavItem["badge"],
  metrics: FunctionReturnType<typeof api.admin.dashboard.getMetrics> | undefined,
): number {
  if (badge === undefined || metrics === undefined) return 0
  if (badge === "underReview") return metrics.deathCases.under_review.value
  if (badge === "pendingLongstop") return metrics.pendingLongstop.value
  return metrics.notifications.failed.value
}

export function AdminSidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const session = useAdminSession()
  // Shares the dashboard's metrics subscription — powers the live nav badges.
  const metrics = useQuery(api.admin.dashboard.getMetrics)
  // shadcn's Sidebar positions with physical left/right — flip it under RTL.
  const { lang } = useLang()

  return (
    <Sidebar collapsible="icon" side={lang === "ar" ? "right" : "left"}>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1.5 group-data-[collapsible=icon]:px-0">
          <Logo size={30} />
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-semibold tracking-tight">Wassiya</span>
            <span className="text-muted-foreground text-xs">{t("nav.brandSub")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (i) => !i.superadminOnly || session?.role === "superadmin",
          )
          if (items.length === 0) return null
          return (
            <Collapsible key={group.labelKey} defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="hover:text-sidebar-foreground transition-colors"
                >
                  <CollapsibleTrigger>
                    {t(group.labelKey)}
                    <ChevronDown className="ms-auto size-3.5 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90 rtl:group-data-[state=closed]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const active =
                          item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href)
                        const count = badgeCount(item.badge, metrics)
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              tooltip={t(item.titleKey)}
                              isActive={active}
                              className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                            >
                              <Link href={item.href}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                            {count > 0 && (
                              <SidebarMenuBadge
                                className={cn(
                                  "rounded-full px-1.5 tabular-nums",
                                  item.badge === "failedNotifications"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                )}
                              >
                                {count > 99 ? "99+" : count}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarSignOut />
      </SidebarFooter>
    </Sidebar>
  )
}
