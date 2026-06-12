import {
  CreditCard,
  FileCheck,
  LayoutDashboard,
  LockOpen,
  Mail,
  Receipt,
  ScrollText,
  ShieldCheck,
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
    labelKey: "nav.groups.delivery",
    items: [
      { titleKey: "nav.notifications", href: "/notifications", icon: Mail, badge: "failedNotifications" },
    ],
  },
  {
    labelKey: "nav.groups.system",
    items: [
      { titleKey: "nav.audit", href: "/audit", icon: ScrollText },
      { titleKey: "nav.admins", href: "/admins", icon: ShieldCheck, superadminOnly: true },
    ],
  },
]
