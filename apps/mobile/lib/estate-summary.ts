import { type AssetPayload } from "@/lib/asset-crypto"

// Pure, client-side estate math — no React / Convex. The total is derived ONLY
// from decrypted payloads held in memory; nothing here ever travels to the
// server (the backend stores ciphertext alone and could not compute it anyway).
//
// INVARIANT: currencies are NEVER combined and NEVER FX-converted — this app
// holds no exchange rates, and a silently-wrong aggregate estate figure is the
// exact "wrong number = broken trust" failure the project guards against. Each
// currency nets independently; the largest bucket is surfaced, the rest listed.

/** Net position for one currency: assets minus debts, with the gross legs kept
 *  so the UI can show how the net was reached (debts are deducted, not hidden). */
export type CurrencyNet = {
  currency: string // ISO 4217, or "" when the user left it blank
  net: number // assets − debts
  assets: number // gross asset total
  debts: number // gross debt total
}

export type EstateSummary = {
  assetCount: number // every asset row, including unvalued ones
  debtCount: number
  /** Per-currency nets, sorted by magnitude. Unvalued rows contribute nothing. */
  currencies: CurrencyNet[]
  /** Largest bucket by |net|, shown as the hero figure; null if nothing valued. */
  primary: CurrencyNet | null
}

/** Fold decrypted payloads into per-currency nets + counts. */
export function computeEstateSummary(
  payloads: readonly AssetPayload[],
): EstateSummary {
  let assetCount = 0
  let debtCount = 0
  const byCurrency = new Map<string, CurrencyNet>()

  for (const p of payloads) {
    const isDebt = p.kind === "debt"
    if (isDebt) debtCount++
    else assetCount++

    if (p.value === null || !Number.isFinite(p.value)) continue
    const currency = p.currency ?? ""
    const bucket = byCurrency.get(currency) ?? {
      currency,
      net: 0,
      assets: 0,
      debts: 0,
    }
    const amount = Math.abs(p.value)
    if (isDebt) {
      bucket.net -= amount
      bucket.debts += amount
    } else {
      bucket.net += amount
      bucket.assets += amount
    }
    byCurrency.set(currency, bucket)
  }

  const currencies = [...byCurrency.values()].sort(
    (a, b) => Math.abs(b.net) - Math.abs(a.net),
  )
  return { assetCount, debtCount, currencies, primary: currencies[0] ?? null }
}

/** Thousands-grouped integer. Hand-rolled — Hermes ships thin Intl locale data,
 *  so we don't lean on `Intl.NumberFormat` for grouping. */
export function formatGrouped(value: number): string {
  const neg = value < 0
  const digits = Math.round(Math.abs(value)).toString()
  let out = ""
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ","
    out += digits[i]
  }
  return (neg ? "-" : "") + out
}

/** Compact magnitude (2.1M, 410k) for dense list rows. */
export function formatCompact(value: number): string {
  const neg = value < 0
  const n = Math.abs(value)
  let out: string
  if (n >= 1_000_000_000) out = `${trimOne(n / 1_000_000_000)}B`
  else if (n >= 1_000_000) out = `${trimOne(n / 1_000_000)}M`
  else if (n >= 1_000) out = `${Math.round(n / 1_000)}k`
  else out = Math.round(n).toString()
  return (neg ? "-" : "") + out
}

function trimOne(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

/** Format a 0–1 fraction as a percent — whole when exact (33%), else one
 *  decimal (12.5%). Used across the Fara'id / Wasiyyah share displays. */
export function pct(x: number): string {
  const p = x * 100
  return (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) + "%"
}

/** Prefix a non-negative magnitude with its currency code (omitted when blank).
 *  Callers pass an absolute value and own the sign so debts read as "−AED …". */
export function formatCurrencyAmount(
  currency: string,
  magnitude: number,
  compact = false,
): string {
  const num = compact ? formatCompact(magnitude) : formatGrouped(magnitude)
  return currency ? `${currency} ${num}` : num
}
