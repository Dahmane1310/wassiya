import {
  Banknote,
  Bitcoin,
  Building2,
  Car,
  Coins,
  FileText,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react-native"
import { type AssetCategory } from "@/lib/asset-crypto"

// Brand order for the category picker. Labels are i18n (`asset.category.<key>`)
// so they translate + flip for Arabic; only the icon mapping lives here.
export const ASSET_CATEGORIES: readonly AssetCategory[] = [
  "real_estate",
  "bank_account",
  "vehicle",
  "cash",
  "business",
  "crypto",
  "document",
  "other",
]

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  real_estate: Landmark,
  bank_account: Banknote,
  vehicle: Car,
  cash: Wallet,
  business: Building2,
  crypto: Bitcoin,
  document: FileText,
  other: Coins,
}

export function categoryIcon(category: AssetCategory): LucideIcon {
  return CATEGORY_ICONS[category] ?? Coins
}

/** A restrained 3-tone tint for a category's icon chip — brand-aligned, not a
 *  rainbow. Teal = wealth, gold = digital, slate = physical/misc. Classes are
 *  written out in full so Uniwind's purge keeps them. Debt rows override this
 *  with a destructive tint at the call site. */
export type CategoryTint = { bg: string; fg: string }

const CATEGORY_TINTS: Record<AssetCategory, CategoryTint> = {
  real_estate: { bg: "bg-primary/10", fg: "text-primary" },
  bank_account: { bg: "bg-primary/10", fg: "text-primary" },
  cash: { bg: "bg-primary/10", fg: "text-primary" },
  business: { bg: "bg-primary/10", fg: "text-primary" },
  crypto: { bg: "bg-gold/15", fg: "text-gold" },
  document: { bg: "bg-gold/15", fg: "text-gold" },
  vehicle: { bg: "bg-chart-4/10", fg: "text-chart-4" },
  other: { bg: "bg-chart-4/10", fg: "text-chart-4" },
}

export function categoryTint(category: AssetCategory): CategoryTint {
  return CATEGORY_TINTS[category] ?? { bg: "bg-muted", fg: "text-muted-foreground" }
}
