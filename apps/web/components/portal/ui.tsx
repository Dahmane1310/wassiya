"use client"

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
} from "react"
import { Icon, type IconName } from "./icon"

type BtnVariant = "primary" | "blue" | "gold" | "green" | "soft" | "ghost" | "danger" | "quiet"
type BtnSize = "sm" | "md" | "lg"

export function Btn({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconR,
  onClick,
  disabled,
  full,
  style = {},
}: {
  children?: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  icon?: IconName
  iconR?: IconName
  onClick?: () => void
  disabled?: boolean
  full?: boolean
  style?: CSSProperties
}) {
  const S = { sm: { h: 36, fs: 13.5, px: 14, r: 10 }, md: { h: 44, fs: 14.5, px: 18, r: 12 }, lg: { h: 52, fs: 16, px: 24, r: 14 } }[size]
  const V: Record<BtnVariant, CSSProperties> = {
    primary: { background: "var(--espresso)", color: "#fff", boxShadow: "var(--shadow-sm)" },
    blue: { background: "var(--primary)", color: "#fff", boxShadow: "0 6px 14px -6px var(--primary)" },
    gold: { background: "var(--gold-deep)", color: "#fff", boxShadow: "0 6px 14px -6px var(--gold-deep)" },
    green: { background: "var(--green)", color: "#fff", boxShadow: "0 6px 14px -7px var(--green)" },
    soft: { background: "var(--surface-3)", color: "var(--ink)" },
    ghost: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)" },
    danger: { background: "var(--red-soft)", color: "var(--red)" },
    quiet: { background: "transparent", color: "var(--ink-2)" },
  }
  return (
    <button
      className="press"
      onClick={onClick}
      disabled={disabled}
      style={{ height: S.h, fontSize: S.fs, padding: `0 ${S.px}px`, borderRadius: S.r, width: full ? "100%" : undefined, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 700, letterSpacing: -0.1, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer", ...V[variant], ...style }}
    >
      {icon && <Icon name={icon} size={S.fs + 3} sw={2} />}
      {children}
      {iconR && <Icon name={iconR} size={S.fs + 2} sw={2} />}
    </button>
  )
}

export function Card({
  children,
  pad = 24,
  style = {},
  onClick,
  hover,
  className = "",
}: {
  children?: ReactNode
  pad?: number
  style?: CSSProperties
  onClick?: () => void
  hover?: boolean
  className?: string
}) {
  return (
    <div
      onClick={onClick}
      className={(hover ? "press " : "") + className}
      style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: pad, boxShadow: "var(--shadow-sm)", ...style }}
    >
      {children}
    </div>
  )
}

type Tone = "neutral" | "green" | "blue" | "gold" | "amber" | "red"

export function Pill({
  children,
  tone = "neutral",
  icon,
  dot,
  style = {},
}: {
  children?: ReactNode
  tone?: Tone
  icon?: IconName
  dot?: boolean
  style?: CSSProperties
}) {
  const T: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: "var(--surface-3)", fg: "var(--ink-2)" },
    green: { bg: "var(--green-soft)", fg: "var(--green)" },
    blue: { bg: "var(--primary-soft)", fg: "var(--primary)" },
    gold: { bg: "var(--gold-soft)", fg: "var(--gold-deep)" },
    amber: { bg: "var(--amber-soft)", fg: "oklch(0.5 0.13 60)" },
    red: { bg: "var(--red-soft)", fg: "var(--red)" },
  }
  const t = T[tone]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: dot ? "0 11px 0 9px" : "0 11px", borderRadius: 99, background: t.bg, color: t.fg, fontSize: 12.5, fontWeight: 700, letterSpacing: -0.1, ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: t.fg }} />}
      {icon && <Icon name={icon} size={13} sw={2.4} />}
      {children}
    </span>
  )
}

export function IconBadge({ name, tint = "var(--primary)", size = 44, r = 13 }: { name: IconName; tint?: string; size?: number; r?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: r, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in oklch, ${tint} 12%, white)`, color: tint }}>
      <Icon name={name} size={size * 0.5} sw={1.9} />
    </div>
  )
}

export function Avatar({ initials, tint = "var(--primary)", size = 44, ring, dim }: { initials: string; tint?: string; size?: number; ring?: boolean; dim?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in oklch, ${tint} ${dim ? 8 : 16}%, white)`, color: tint, border: ring ? `2.5px solid ${tint}` : "none", fontWeight: 700, fontSize: size * 0.36, letterSpacing: -0.3, opacity: dim ? 0.55 : 1 }}>
      {initials}
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, color = "var(--primary)", track = "var(--line)", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setV(value), 120)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      {children && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>}
    </div>
  )
}

export function Field({ label, value, onChange, placeholder, prefix, type = "text", mono, hint, autoFocus }: { label?: string; value: string; onChange?: (v: string) => void; placeholder?: string; prefix?: string; type?: string; mono?: boolean; hint?: string; autoFocus?: boolean }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 7 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "0 14px", height: 50 }}>
        {prefix && <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 14 }}>{prefix}</span>}
        <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={mono ? "mono" : ""} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: "var(--ink)", width: "100%" }} />
      </div>
      {hint && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6, fontWeight: 500 }}>{hint}</div>}
    </label>
  )
}

export function SectionTitle({ children, sub, right, style = {} }: { children?: ReactNode; sub?: string; right?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="serif" style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.15 }}>{children}</h2>
        {sub && <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 5, fontWeight: 500 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

export function Page({ children, width = 760, style = {} }: { children?: ReactNode; width?: number; style?: CSSProperties }) {
  return <div className="w-fade" style={{ maxWidth: width, margin: "0 auto", padding: "40px 24px 72px", ...style }}>{children}</div>
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button className="press" onClick={() => onChange?.(!on)} style={{ width: 46, height: 28, borderRadius: 99, padding: 2, background: on ? "var(--green)" : "var(--line)", transition: "background .2s", display: "flex", justifyContent: on ? "flex-end" : "flex-start", flexShrink: 0 }}>
      <span style={{ width: 24, height: 24, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </button>
  )
}

export function Modal({ open, onClose, children, width = 460 }: { open: boolean; onClose?: () => void; children?: ReactNode; width?: number }) {
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} className="w-fade" style={{ position: "absolute", inset: 0, background: "rgba(20,22,30,.5)", backdropFilter: "blur(3px)" }} />
      <div className="w-up" style={{ position: "relative", width, maxWidth: "94vw", background: "var(--bg)", borderRadius: 22, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>{children}</div>
    </div>
  )
}

export type StatusKey = "active" | "grace" | "pending" | "released"
export const STATUS: Record<StatusKey, { label: string; tone: Tone; icon: IconName; desc: string }> = {
  active: { label: "Active & healthy", tone: "green", icon: "pulse", desc: "Checking in regularly. Nothing for you to do." },
  grace: { label: "Check-in overdue", tone: "amber", icon: "clock", desc: "A check-in was missed — a grace period is counting down." },
  pending: { label: "Awaiting verification", tone: "gold", icon: "file", desc: "Grace has lapsed. A death certificate is being reviewed." },
  released: { label: "Released to you", tone: "blue", icon: "lockOpen", desc: "The instructions left for you are ready to view." },
}

export function toneColor(tone: Tone): string {
  return tone === "green" ? "var(--green)" : tone === "amber" ? "oklch(0.55 0.13 60)" : tone === "blue" ? "var(--primary)" : tone === "gold" ? "var(--gold-deep)" : "var(--ink-3)"
}
