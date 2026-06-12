"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { type FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/api"
import { Avatar, Card, displayStatus, Page, Pill, SectionTitle, STATUS, toneColor } from "./ui"
import { Icon } from "./icon"
import { daysFromNow, initialsOf, relPast, tintFor } from "./format"
import { PrivacyLink } from "./privacy-explainer"

type Benefactor = FunctionReturnType<typeof api.recipients.listMyBenefactors>[number]

export function Home() {
  const benefactors = useQuery(api.recipients.listMyBenefactors)
  const keyStatus = useQuery(api.recipients.getMyRecipientStatus)

  if (benefactors === undefined) {
    return <Page><p style={{ fontSize: 14, color: "var(--ink-3)" }}>Loading…</p></Page>
  }
  // Support-disabled account: every query returns empty, so show the real reason.
  if (keyStatus?.disabled) {
    return (
      <Page>
        <Card pad={28}>
          <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
            <Icon name="alert" size={28} style={{ margin: "0 auto 10px", color: "var(--red)" }} />
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-2)" }}>This account has been disabled</div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>Everything entrusted to you is safe and untouched. Contact support to restore access.</div>
          </div>
        </Card>
      </Page>
    )
  }
  const released = benefactors.filter((b) => b.status === "released").length

  return (
    <Page>
      <div style={{ marginBottom: 26 }}>
        <div className="ar" style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>السلام عليكم</div>
        <h1 className="serif" style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>Welcome</h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 9, fontWeight: 500, lineHeight: 1.55, maxWidth: 540 }}>You&apos;ve been entrusted with the legacies below. There&apos;s nothing you need to do until the time comes — we&apos;ll guide you when it does.</p>
      </div>

      <KeyStatusCard enrolled={keyStatus?.enrolled ?? false} fingerprint={keyStatus?.keyFingerprint ?? null} />

      {released > 0 && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", background: "linear-gradient(150deg, var(--blue-soft), color-mix(in oklch, var(--blue-soft) 50%, white))", border: "1px solid color-mix(in oklch, var(--blue) 20%, white)", borderRadius: 14 }}>
          <Icon name="lockOpen" size={20} style={{ color: "var(--blue)", flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--blue-600)" }}>{released} legacy {released === 1 ? "has" : "have"} been released to you and {released === 1 ? "is" : "are"} ready to view.</div>
        </div>
      )}

      <div style={{ marginTop: 34 }}>
        <SectionTitle sub={benefactors.length ? `${benefactors.length} ${benefactors.length === 1 ? "person has" : "people have"} entrusted you` : undefined}>People who named you</SectionTitle>
        {benefactors.length === 0 ? (
          <Card pad={28}>
            <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
              <Icon name="user" size={28} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-2)" }}>No one has named you yet</div>
              <div style={{ fontSize: 13, marginTop: 3 }}>When someone entrusts you with their legacy, they&apos;ll appear here.</div>
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {benefactors.map((b) => <BenefactorCard key={b.beneficiaryId} b={b} />)}
          </div>
        )}
      </div>

      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--ink-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="lock" size={15} /><span style={{ fontSize: 12.5, fontWeight: 500, textAlign: "center", lineHeight: 1.6 }}>Private to you. Wassiya can never see what&apos;s inside — only your key can open it.</span>
        </div>
        <PrivacyLink />
      </div>
    </Page>
  )
}

function KeyStatusCard({ enrolled, fingerprint }: { enrolled: boolean; fingerprint: string | null }) {
  return (
    <Link href="/account" style={{ display: "block" }}>
      <Card pad={20} className="lift" style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: enrolled ? "var(--green-soft)" : "var(--amber-soft)", color: enrolled ? "var(--green)" : "oklch(0.5 0.13 60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="shieldCheck" size={26} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>{enrolled ? "Your key is ready" : "Set up your key"}</span>
            {enrolled ? <Pill tone="green" dot>Ready</Pill> : <Pill tone="amber" dot>Action needed</Pill>}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500, marginTop: 3 }}>
            {enrolled && fingerprint ? <>Recovery code saved · verification code <span className="mono" style={{ color: "var(--ink-2)" }}>{fingerprint.slice(0, 23)}…</span></> : "Open an invite link to set up your key."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)", fontSize: 13.5, fontWeight: 700, flexShrink: 0 }}>Manage<Icon name="chevR" size={16} /></div>
      </Card>
    </Link>
  )
}

function BenefactorCard({ b }: { b: Benefactor }) {
  const shown = displayStatus(b.status, b.deathCase)
  const s = STATUS[shown]
  const graceDays = b.graceStartedAt != null && b.gracePeriodMs != null ? daysFromNow(b.graceStartedAt + b.gracePeriodMs) : null
  const meta =
    shown === "rejected" ? "Reviewed — see the note"
    : b.status === "active" ? `Next check-in in ${daysFromNow(b.nextDeadlineAt) ?? 0} days`
    : b.status === "grace" ? `Grace ends in ${graceDays ?? 0} days`
    : b.status === "released" ? `Released ${relPast(b.releaseAuthorizedAt)}`
    : "Under review"
  const footer =
    b.status === "released" ? { tone: "blue" as const, icon: "lockOpen" as const, text: "Ready to view — open to see what was left for you" }
    : shown === "rejected" ? { tone: "red" as const, icon: "alert" as const, text: "The report couldn't be approved — open to see why and submit again" }
    : b.status === "grace" ? { tone: "amber" as const, icon: "info" as const, text: "You can report a death to begin verification" }
    : null
  const fbg = footer ? (footer.tone === "blue" ? "var(--blue-soft)" : footer.tone === "red" ? "var(--red-soft)" : "var(--amber-soft)") : undefined
  const ffg = footer ? (footer.tone === "blue" ? "var(--blue-600)" : footer.tone === "red" ? "var(--red)" : "oklch(0.5 0.13 60)") : undefined

  return (
    <Link href={`/benefactor/${b.beneficiaryId}`} style={{ display: "block" }}>
      <Card pad={0} className="lift" style={{ cursor: "pointer", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center", padding: "18px 22px" }}>
          <Avatar initials={initialsOf(b.ownerName)} tint={tintFor(b.ownerId)} size={50} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.ownerName}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 3 }}>{b.relationship ? `their ${b.relationship}` : b.role === "heir" ? "legal heir" : "named recipient"}{b.shareLabel ? ` · ${b.shareLabel}` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <Pill tone={s.tone} icon={s.icon}>{s.label}</Pill>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginTop: 7 }}>{meta}</div>
            </div>
            <Icon name="chevR" size={18} style={{ color: "var(--ink-3)" }} />
          </div>
        </div>
        {footer && (
          <div style={{ background: fbg, padding: "11px 22px", display: "flex", alignItems: "center", gap: 9, color: ffg, borderTop: `1px solid color-mix(in oklch, ${toneColor(footer.tone)} 14%, white)` }}>
            <Icon name={footer.icon} size={16} /><span style={{ fontSize: 13, fontWeight: 700 }}>{footer.text}</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
