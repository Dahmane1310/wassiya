"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { api } from "@workspace/backend/api"
import { Avatar, Btn, Card, Page, Pill, SectionTitle } from "./ui"
import { Icon } from "./icon"
import { initialsOf } from "./format"
import { PrivacyLink } from "./privacy-explainer"

export function Account() {
  const status = useQuery(api.recipients.getMyRecipientStatus)
  const { user, signOut } = useAuth()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You"
  const email = user?.email ?? ""
  const enrolled = status?.enrolled ?? false

  return (
    <Page width={720} style={{ paddingTop: 34 }}>
      <SectionTitle sub="One key unlocks every legacy you've been named in">My key</SectionTitle>

      <Card pad={24} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar initials={initialsOf(name)} tint="var(--primary)" size={56} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div><div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>{email}</div></div>
          {enrolled ? <Pill tone="green" dot>Key ready</Pill> : <Pill tone="amber" dot>Not set up yet</Pill>}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card pad={22}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Icon name="check" size={20} style={{ color: "var(--primary)" }} /><span style={{ fontSize: 14.5, fontWeight: 700 }}>Verification code</span></div>
          <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: 0.3, wordBreak: "break-all" }}>{status?.keyFingerprint ?? "—"}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>Read this to anyone who names you so they can confirm it&apos;s really you.</div>
        </Card>
        <Card pad={22}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Icon name="refresh" size={20} style={{ color: "var(--gold-deep)" }} /><span style={{ fontSize: 14.5, fontWeight: 700 }}>Recovery code</span></div>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 600 }}>Saved when you set up your key.</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>It&apos;s the only key to everything left for you, and it&apos;s never kept here — we can&apos;t show it again. If you lose it, it can&apos;t be recovered, and a legacy already released to you could no longer be opened. Please keep it somewhere safe now.</div>
        </Card>
      </div>

      <Card pad={24}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="lock" size={22} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Private to you</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 1, lineHeight: 1.5 }}>Your legacy is locked on your device — openable only with your key or recovery code. We can never see it.</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}><PrivacyLink /></div>
      </Card>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}><Btn variant="ghost" icon="logout" onClick={() => void signOut()}>Sign out</Btn></div>
      <div style={{ marginTop: 18, textAlign: "center", fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>Wassiya · <span className="ar">وصية</span> · Beneficiary portal</div>
    </Page>
  )
}
