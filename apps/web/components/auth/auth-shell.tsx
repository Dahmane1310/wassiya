"use client"

import { type ReactNode } from "react"
import { Wordmark } from "@/components/portal/logo"
import { Icon } from "@/components/portal/icon"

/** Branded split shell for the auth pages: espresso story panel + form column.
 *  Same visual language as the invite enrollment panel. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal" style={{ minHeight: "100vh" }}>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr", alignItems: "stretch" }}>
        <div className="auth-grid" style={{ display: "grid", gridTemplateColumns: "1fr", minHeight: "100vh" }}>
          <div
            className="auth-brand"
            style={{
              background:
                "radial-gradient(700px 500px at 30% 0%, oklch(0.3 0.02 60), transparent 60%), linear-gradient(160deg, var(--sidebar), oklch(0.14 0.01 60))",
              color: "#fff",
              padding: "56px 60px",
              display: "none",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Wordmark size={44} />
            <div>
              <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.12, letterSpacing: -0.6, margin: 0 }}>
                Everything they&apos;ll need,
                <br />
                kept safe until it matters.
              </h1>
              <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6, marginTop: 16, fontWeight: 500, maxWidth: 380 }}>
                Wassiya keeps your wishes private while you&apos;re here, and delivers
                them to the right people when you&apos;re not.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              <Icon name="shieldCheck" size={17} style={{ color: "var(--gold)" }} /> Private — only you can open your vault
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 24px",
              background:
                "radial-gradient(900px 600px at 50% -10%, var(--gold-soft), transparent 55%), var(--bg)",
            }}
          >
            <div className="w-up" style={{ width: 400, maxWidth: "100%" }}>{children}</div>
          </div>
        </div>
      </div>
      <style>{`@media (min-width: 900px) { .auth-grid { grid-template-columns: 1fr 1fr !important; } .auth-brand { display: flex !important; } }`}</style>
    </div>
  )
}
