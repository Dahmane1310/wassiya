import {
  CreditCard,
  FileCheck,
  LayoutDashboard,
  Plug,
  LayoutList,
  LockOpen,
  Mail,
  PanelBottom,
  Receipt,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Tags,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  titleKey: string
  href: string
  icon: LucideIcon
  superadminOnly?: boolean
  /** Live count chip sourced from dashboard metrics (hidden when 0). */
  badge?: "underReview" | "pendingLongstop" | "failedNotifications"
}

export type NavGroup = { labelKey: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [{ titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    // The death → verification → release lifecycle.
    labelKey: "nav.groups.estate",
    items: [
      { titleKey: "nav.review", href: "/review", icon: FileCheck, badge: "underReview" },
      { titleKey: "nav.releases", href: "/releases", icon: LockOpen, badge: "pendingLongstop" },
    ],
  },
  {
    labelKey: "nav.groups.people",
    items: [
      { titleKey: "nav.users", href: "/users", icon: Users },
      { titleKey: "nav.beneficiaries", href: "/beneficiaries", icon: UserCheck },
      { titleKey: "nav.admins", href: "/admins", icon: ShieldCheck, superadminOnly: true },
    ],
  },
  {
    labelKey: "nav.groups.revenue",
    items: [
      { titleKey: "nav.entitlements", href: "/entitlements", icon: CreditCard },
      { titleKey: "nav.billing", href: "/billing", icon: Receipt },
    ],
  },
  {
    // The landing-page CMS, one page per content area.
    labelKey: "nav.groups.content",
    items: [
      { titleKey: "nav.landingHero", href: "/landing/hero", icon: Sparkles },
      { titleKey: "nav.landingSections", href: "/landing/sections", icon: LayoutList },
      { titleKey: "nav.landingPricing", href: "/landing/pricing", icon: Tags },
      { titleKey: "nav.landingFooter", href: "/landing/footer", icon: PanelBottom },
    ],
  },
  {
    labelKey: "nav.groups.system",
    items: [
      { titleKey: "nav.notifications", href: "/notifications", icon: Mail, badge: "failedNotifications" },
      { titleKey: "nav.audit", href: "/audit", icon: ScrollText },
      { titleKey: "nav.integrations", href: "/integrations", icon: Plug },
    ],
  },
]
