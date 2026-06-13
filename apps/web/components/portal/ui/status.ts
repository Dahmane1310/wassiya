import {
  Activity,
  Clock,
  File,
  LockOpen,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

// Status model + tone class maps for the portal. `label`/`desc` are i18n KEYS
// (locales/*.json "status" section) — consumers render them with t(s.label).

export type Tone = "neutral" | "green" | "blue" | "gold" | "amber" | "red"

/** Badge-style chip classes per tone (bg + text). Blue has no Tailwind theme
 *  mapping (kept off @theme to protect Tailwind's own blue scale) — it uses
 *  arbitrary-value classes over the shared CSS vars. */
export const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-secondary text-muted-foreground",
  green: "bg-green-soft text-green",
  blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
  gold: "bg-gold-soft text-gold-deep",
  amber: "bg-amber-soft text-amber-700 dark:text-amber-400",
  red: "bg-red-soft text-destructive",
}

/** Tinted full-surface classes (status summary card on the detail page). */
export const TONE_SURFACE: Record<Tone, string> = {
  neutral: "bg-secondary border-border",
  green: "bg-green-soft border-[color-mix(in_oklch,var(--green)_25%,var(--card))]",
  blue: "bg-[var(--blue-soft)] border-[color-mix(in_oklch,var(--blue)_25%,var(--card))]",
  gold: "bg-gold-soft border-[color-mix(in_oklch,var(--gold-deep)_25%,var(--card))]",
  amber: "bg-amber-soft border-[color-mix(in_oklch,var(--amber)_30%,var(--card))]",
  red: "bg-red-soft border-[color-mix(in_oklch,var(--destructive)_25%,var(--card))]",
}

/** Quiet footer-strip classes (home card footers). */
export const TONE_STRIP: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  green: "bg-green-soft text-green",
  blue: "bg-[var(--blue-soft)] text-[var(--blue-600)]",
  gold: "bg-gold-soft text-gold-deep",
  amber: "bg-amber-soft text-amber-700 dark:text-amber-400",
  red: "bg-red-soft text-destructive",
}

/** Plain CSS color per tone — for color-mix tinting (icon badges, soft
 *  surfaces). Amber uses a mid value readable on its soft background. */
export const TONE_COLOR: Record<Tone, string> = {
  neutral: "var(--ink-3)",
  green: "var(--green)",
  blue: "var(--blue)",
  gold: "var(--gold-deep)",
  amber: "oklch(0.6 0.13 65)",
  red: "var(--destructive)",
}

export type StatusKey = "active" | "grace" | "pending" | "released" | "rejected"

export const STATUS: Record<
  StatusKey,
  { label: string; tone: Tone; icon: LucideIcon; desc: string }
> = {
  active: {
    label: "status.active.label",
    tone: "green",
    icon: Activity,
    desc: "status.active.desc",
  },
  grace: {
    label: "status.grace.label",
    tone: "amber",
    icon: Clock,
    desc: "status.grace.desc",
  },
  pending: {
    label: "status.pending.label",
    tone: "gold",
    icon: File,
    desc: "status.pending.desc",
  },
  released: {
    label: "status.released.label",
    tone: "blue",
    icon: LockOpen,
    desc: "status.released.desc",
  },
  // Display-only overlay: the switch may still be counting down, but the
  // submitted report was reviewed and couldn't be approved.
  rejected: {
    label: "status.rejected.label",
    tone: "red",
    icon: TriangleAlert,
    desc: "status.rejected.desc",
  },
}

/** The status to DISPLAY: a rejected death report overlays the switch state
 *  (unless the estate has already been released). */
export function displayStatus(
  status: Exclude<StatusKey, "rejected">,
  deathCase: { status: string } | null,
): StatusKey {
  return status !== "released" && deathCase?.status === "rejected" ? "rejected" : status
}
