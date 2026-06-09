"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { Avatar } from "./ui"
import { Icon, type IconName } from "./icon"
import { Wordmark } from "./logo"

function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (email[0] ?? "?").toUpperCase()
}

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!menu) return
    const h = () => setMenu(false)
    window.addEventListener("click", h)
    return () => window.removeEventListener("click", h)
  }, [menu])

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You"
  const email = user?.email ?? ""
  const initials = initialsOf(name, email)
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/account", label: "My Key", icon: "key" },
  ]
  const active = (href: string) => pathname === href || (href === "/home" && pathname.startsWith("/benefactor"))

  return (
    <header style={{ height: 64, flexShrink: 0, borderBottom: "1px solid var(--line)", background: "color-mix(in oklch, var(--surface) 86%, transparent)", backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)", position: "sticky", top: 0, zIndex: 50, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 22px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <button className="press" onClick={() => router.push("/home")} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Wordmark size={32} />
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--gold-deep)", background: "var(--gold-soft)", padding: "3px 8px", borderRadius: 7, textTransform: "uppercase" }}>Beneficiary</span>
        </button>
      </div>

      <nav style={{ display: "flex", gap: 3, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 4 }}>
        {items.map((it) => {
          const on = active(it.href)
          return (
            <button key={it.href} className="press" onClick={() => router.push(it.href)} style={{ height: 34, padding: "0 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, letterSpacing: -0.1, display: "flex", alignItems: "center", gap: 7, color: on ? "var(--ink)" : "var(--ink-3)", background: on ? "var(--surface)" : "transparent", boxShadow: on ? "var(--shadow-sm)" : "none", transition: "background .18s, color .18s, box-shadow .18s" }}>
              <Icon name={it.icon} size={15} sw={2} />
              {it.label}
            </button>
          )
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
        <span className="trust-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: 99, background: "var(--green-soft)", color: "var(--green)", fontSize: 12, fontWeight: 700 }}><Icon name="shieldCheck" size={14} /> Private</span>
        <div style={{ position: "relative" }}>
          <button className="press" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m) }} style={{ display: "flex", alignItems: "center", gap: 9, height: 42, padding: "0 6px 0 4px", borderRadius: 99, border: "1px solid " + (menu ? "var(--line)" : "transparent"), background: menu ? "var(--surface-2)" : "transparent" }}>
            <Avatar initials={initials} tint="var(--primary)" size={34} />
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{name.split(" ")[0]}</span>
            <Icon name="chevD" size={15} style={{ color: "var(--ink-3)", transform: menu ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
          {menu && (
            <div className="w-up" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 50, right: 0, width: 248, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 15, boxShadow: "var(--shadow-lg)", padding: 8, zIndex: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 10px 12px" }}>
                <Avatar initials={initials} tint="var(--primary)" size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--line-2)", margin: "0 2px 6px" }} />
              <MenuItem icon="key" label="My key" onClick={() => { setMenu(false); router.push("/account") }} />
              <div style={{ height: 1, background: "var(--line-2)", margin: "6px 2px" }} />
              <MenuItem icon="logout" label="Sign out" danger onClick={() => { setMenu(false); void signOut() }} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className="rowhover" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", height: 40, padding: "0 10px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: danger ? "var(--red)" : "var(--ink)" }}>
      <Icon name={icon} size={17} sw={1.9} style={{ color: danger ? "var(--red)" : "var(--ink-3)" }} />
      {label}
    </button>
  )
}
