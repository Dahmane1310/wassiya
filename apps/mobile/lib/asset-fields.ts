import { type AssetCategory } from "@/lib/asset-crypto"

// Category-specific form fields. A car asks make/model/plate/keys; a house asks
// address/deed; a bank account asks bank/IBAN; etc. Labels + placeholders are
// i18n (`assetFields.<key>` / `assetFields.<key>_ph`). `sensitive` fields render
// mono + are revealed-on-tap on the detail screen.

export type AssetFieldDef = {
  numeric?: boolean
  sensitive?: boolean
  multiline?: boolean
}

export const ASSET_FIELDS: Record<string, AssetFieldDef> = {
  address: {},
  deed: { sensitive: true },
  bank: {},
  iban: { sensitive: true },
  accountType: {},
  makeModel: {},
  year: { numeric: true },
  plate: {},
  keys: { sensitive: true },
  location: { sensitive: true },
  combination: { sensitive: true },
  company: {},
  shareholding: {},
  contact: {},
  walletType: {},
  seed: { sensitive: true, multiline: true },
  pinHint: { sensitive: true },
  docType: {},
  policyRef: {},
  storedAt: {},
}

export const CATEGORY_FIELDS: Record<AssetCategory, string[]> = {
  real_estate: ["address", "deed"],
  bank_account: ["bank", "iban", "accountType"],
  vehicle: ["makeModel", "year", "plate", "keys"],
  cash: ["location", "combination"],
  business: ["company", "shareholding", "contact"],
  crypto: ["walletType", "seed", "pinHint"],
  document: ["docType", "policyRef", "storedAt"],
  other: [],
}

// The one NON-SENSITIVE detail field worth surfacing on a list row, per category
// (a car shows its make/model, a house its area, a bank its name). Sensitive
// fields (IBAN, deed №, seed, safe location) are deliberately never summarised —
// they stay hidden until the detail screen reveals them.
export const CATEGORY_SUMMARY: Record<AssetCategory, string | null> = {
  real_estate: "address",
  bank_account: "bank",
  vehicle: "makeModel",
  cash: null,
  business: "company",
  crypto: "walletType",
  document: "docType",
  other: null,
}

/** The card subtitle detail for an asset (e.g. its area / bank / model), or null. */
export function summaryDetail(
  category: AssetCategory,
  details: Record<string, string> | null
): string | null {
  const key = CATEGORY_SUMMARY[category]
  if (!key || !details) return null
  return details[key]?.trim() || null
}

/** Keep only the category's fields that are non-empty (trimmed). Null when empty. */
export function pickDetails(
  category: AssetCategory,
  details: Record<string, string>
): Record<string, string> | null {
  const out: Record<string, string> = {}
  for (const key of CATEGORY_FIELDS[category]) {
    const v = details[key]?.trim()
    if (v) out[key] = v
  }
  return Object.keys(out).length > 0 ? out : null
}
