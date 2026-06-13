// Client-side time formatting for the portal (safe to read wall-clock here — these
// are not Convex queries). Backend returns raw timestamps; the UI derives labels.

import i18n from "@/lib/i18n"

export function daysFromNow(ts: number | null): number | null {
  if (ts == null) return null
  return Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000))
}

export function relPast(ts: number | null): string {
  if (ts == null) return ""
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d <= 0) return i18n.t("common.today")
  if (d === 1) return i18n.t("common.yesterday")
  if (d < 14) return i18n.t("common.daysAgo", { count: d })
  if (d < 60) return i18n.t("common.weeksAgo", { count: Math.floor(d / 7) })
  return i18n.t("common.monthsAgo", { count: Math.floor(d / 30) })
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return "•"
}

// Deterministic avatar tint from a string (so each benefactor keeps a stable hue).
const TINTS = ["var(--primary)", "var(--blue)", "var(--green)", "oklch(0.52 0.11 285)", "oklch(0.52 0.06 255)"]
export function tintFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]!
}
