import {
  Bitcoin,
  Briefcase,
  Car,
  Check,
  Coins,
  FileText,
  Gift,
  Heart,
  House,
  Landmark,
  Lock,
  ScrollText,
  User,
  Users,
  type LucideIcon,
} from "lucide-react-native"
import type { ThemeColors } from "@/lib/colors"

/**
 * Front-end mock estate, ported from the Claude Design prototype (`data.jsx`).
 *
 * These power the redesigned Vault / Heirs / Wasiyyah screens, which have NO
 * backend yet (the heartbeat, family-tree graph and Wasiyyah tables aren't built —
 * see CLAUDE.md §"not yet built"). The Assets tab is the exception: it stays wired
 * to Convex. Swap these for real queries as the backend lands. Realistic GCC
 * placeholders in AED.
 */

type ColorKey = keyof ThemeColors

// ── formatting
export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US")
export const fmtShort = (n: number) => {
  if (n >= 1e6) return "AED " + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M"
  if (n >= 1e3) return "AED " + (n / 1e3).toFixed(0) + "K"
  return "AED " + n
}
export const pct = (x: number) =>
  ((x * 100) % 1 === 0 ? (x * 100).toFixed(0) : (x * 100).toFixed(1)) + "%"

// ── asset categories
export type AssetCategory =
  | "realestate"
  | "bank"
  | "cash"
  | "vehicle"
  | "business"
  | "crypto"
  | "document"

export type CategoryMeta = { label: string; icon: LucideIcon; color: ColorKey }

export const CATS: Record<AssetCategory, CategoryMeta> = {
  realestate: { label: "Real Estate", icon: House, color: "primary" },
  bank: { label: "Bank Accounts", icon: Landmark, color: "green" },
  cash: { label: "Cash & Valuables", icon: Coins, color: "goldDeep" },
  vehicle: { label: "Vehicles", icon: Car, color: "violet" },
  business: { label: "Business Shares", icon: Briefcase, color: "teal" },
  crypto: { label: "Digital & Crypto", icon: Bitcoin, color: "gold" },
  document: { label: "Documents", icon: FileText, color: "ink2" },
}

export type MockAsset = {
  id: string
  cat: AssetCategory
  name: string
  meta: string
  value: number
  secret: string
}

export const ASSETS: MockAsset[] = [
  { id: "a1", cat: "realestate", name: "Villa — Palm Jumeirah", meta: "Frond K · Title deed", value: 12500000, secret: "Deed № PJ-K-2291 · Safe drawer 2" },
  { id: "a2", cat: "realestate", name: "Apartment — Downtown", meta: "Burj Vista, 2BR", value: 3200000, secret: "Deed № DT-BV-1107" },
  { id: "a3", cat: "business", name: "Al Noor Trading LLC", meta: "40% shareholding", value: 5000000, secret: "Share cert · Lawyer: Faris & Co" },
  { id: "a4", cat: "crypto", name: "Cold wallet — Ledger", meta: "BTC · ETH · USDC", value: 2800000, secret: "24-word seed · PIN reminder inside" },
  { id: "a5", cat: "bank", name: "Emirates NBD — Current", meta: "•••• 4471", value: 480000, secret: "IBAN AE07 •••• 4471" },
  { id: "a6", cat: "bank", name: "ADCB — Savings", meta: "•••• 9982", value: 1100000, secret: "IBAN AE60 •••• 9982" },
  { id: "a7", cat: "cash", name: "Home safe — cash & gold", meta: "Cash + 1.2kg gold", value: 520000, secret: "Combination 18-04-77" },
  { id: "a8", cat: "vehicle", name: "Range Rover Autobiography", meta: "2024 · Plate F 12", value: 650000, secret: "Reg card · 2nd key: study" },
  { id: "a9", cat: "document", name: "Insurance policies", meta: "Life · Health · Property", value: 0, secret: "MetLife #LF-22-8841" },
  { id: "a10", cat: "document", name: "Passwords & accounts", meta: "12 logins", value: 0, secret: "1Password emergency kit" },
]

export const DEBTS = [
  { id: "d1", name: "Mortgage — Palm Villa", value: 2100000, lender: "Emirates NBD" },
]

export const totalEstate = ASSETS.reduce((s, a) => s + a.value, 0)
export const totalDebts = DEBTS.reduce((s, d) => s + d.value, 0)
export const netEstate = totalEstate - totalDebts

// ── family / heirs
export type Relationship =
  | "Spouse"
  | "Father"
  | "Mother"
  | "Son"
  | "Daughter"
  | "Sibling"

export type Heir = {
  id: string
  name: string
  rel: Relationship
  relAr: string
  living: boolean
  gender: "m" | "f"
  initials: string
}

export const FAMILY: Heir[] = [
  { id: "h1", name: "Layla", rel: "Spouse", relAr: "الزوجة", living: true, gender: "f", initials: "LA" },
  { id: "h2", name: "Abdullah", rel: "Father", relAr: "الأب", living: true, gender: "m", initials: "AB" },
  { id: "h3", name: "Fatima", rel: "Mother", relAr: "الأم", living: true, gender: "f", initials: "FA" },
  { id: "h4", name: "Omar", rel: "Son", relAr: "الابن", living: true, gender: "m", initials: "OM" },
  { id: "h5", name: "Yusuf", rel: "Son", relAr: "الابن", living: true, gender: "m", initials: "YU" },
  { id: "h6", name: "Mariam", rel: "Daughter", relAr: "البنت", living: true, gender: "f", initials: "MA" },
  { id: "h7", name: "Sara", rel: "Daughter", relAr: "البنت", living: true, gender: "f", initials: "SA" },
]

/** Stable index of a heir in FAMILY — used to give each heir a consistent hue
 *  across the family tree, the donut and the legend (see `heirPalette`). */
export const heirIndex = (id: string) => FAMILY.findIndex((m) => m.id === id)

/**
 * PROVISIONAL Fara'id calc — a simplified canonical case (spouse + both parents +
 * sons & daughters present), ported verbatim from the design prototype. This is NOT
 * the legal computation: real Fara'id (with `awl`/`radd`, blocking rules, full heir
 * set) belongs in the Convex engine. UI-only, for the what-if donut. Returns
 * { heirId: fraction-of-the-Fara'id-pool }.
 */
export function faraid(members: Heir[]): Record<string, number> {
  const live = members.filter((m) => m.living)
  const has = (rel: Relationship) => live.some((m) => m.rel === rel)
  const sons = live.filter((m) => m.rel === "Son")
  const daughters = live.filter((m) => m.rel === "Daughter")
  const hasChildren = sons.length + daughters.length > 0
  const shares: Record<string, number> = {}
  let fixed = 0
  // Owner is male → spouse is the wife: 1/8 with children, else 1/4.
  if (has("Spouse")) {
    const s = hasChildren ? 1 / 8 : 1 / 4
    shares["h1"] = s
    fixed += s
  }
  if (has("Father")) {
    const f = live.find((m) => m.rel === "Father")!
    shares[f.id] = 1 / 6
    fixed += 1 / 6
  }
  if (has("Mother")) {
    const f = live.find((m) => m.rel === "Mother")!
    shares[f.id] = 1 / 6
    fixed += 1 / 6
  }
  // Residue to children, sons : daughters = 2 : 1.
  const residue = Math.max(0, 1 - fixed)
  const parts = sons.length * 2 + daughters.length
  if (parts > 0) {
    const unit = residue / parts
    sons.forEach((s) => (shares[s.id] = unit * 2))
    daughters.forEach((d) => (shares[d.id] = unit))
  }
  return shares
}

// ── Wasiyyah (freely-willed bequest, capped at 1/3)
export const WASIYYAH_CAP = 1 / 3

export type Bequest = {
  id: string
  name: string
  type: string
  pctOfEstate: number
  icon: LucideIcon
}

export const WASIYYAH: Bequest[] = [
  { id: "w1", name: "Dar Al Ber Society", type: "Charity (Sadaqah Jariyah)", pctOfEstate: 0.15, icon: Heart },
  { id: "w2", name: "Khalid (nephew)", type: "Non-heir relative", pctOfEstate: 0.1, icon: User },
  { id: "w3", name: "Staff gratuity — Maria", type: "Gift", pctOfEstate: 0.05, icon: Gift },
]

// ── heartbeat / switch
export const HEARTBEAT = {
  cadenceDays: 30,
  lastCheckin: "3 days ago",
  nextDueDays: 27,
  graceDays: 14,
  streak: 14,
  executors: [
    { id: "e1", name: "Layla", role: "Primary executor", phone: "+971 50 ••• 4412", initials: "LA" },
    { id: "e2", name: "Faris & Co (lawyer)", role: "Legal executor", phone: "+971 4 ••• 9008", initials: "FC" },
  ],
}

export type Activity = {
  id: string
  icon: LucideIcon
  color: ColorKey
  text: string
  when: string
}

export const ACTIVITY: Activity[] = [
  { id: "ac1", icon: Check, color: "green", text: "Heartbeat check-in confirmed", when: "3 days ago" },
  { id: "ac2", icon: Lock, color: "primary", text: "Encrypted “Cold wallet — Ledger”", when: "6 days ago" },
  { id: "ac3", icon: Users, color: "goldDeep", text: "Added Sara as daughter (heir)", when: "2 weeks ago" },
  { id: "ac4", icon: ScrollText, color: "goldDeep", text: "Updated Wasiyyah — Dar Al Ber 15%", when: "3 weeks ago" },
]
