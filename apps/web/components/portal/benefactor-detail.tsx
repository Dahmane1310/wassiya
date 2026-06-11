"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Avatar, Btn, Card, displayStatus, IconBadge, Page, Pill, SectionTitle, STATUS, toneColor } from "./ui"
import { Icon } from "./icon"
import { daysFromNow, initialsOf, relPast, tintFor } from "./format"
import { ReportDeath } from "./report-death"
import { ReleaseReveal } from "./release-reveal"

export function BenefactorDetail({ id }: { id: string }) {
  const benefactors = useQuery(api.recipients.listMyBenefactors)
  const [showReport, setShowReport] = useState(false)
  const [showRelease, setShowRelease] = useState(false)

  if (benefactors === undefined) {
    return <Page width={720}><p style={{ fontSize: 14, color: "var(--ink-3)" }}>Loading…</p></Page>
  }
  const b = benefactors.find((x) => x.beneficiaryId === id)
  if (!b) {
    return (
      <Page width={720}>
        <p style={{ fontSize: 15, color: "var(--ink-2)", fontWeight: 600 }}>This legacy isn&apos;t available.</p>
        <Link href="/home" style={{ color: "var(--primary)", fontWeight: 700, fontSize: 14 }}>← Back home</Link>
      </Page>
    )
  }
  const shown = displayStatus(b.status, b.deathCase)
  const s = STATUS[shown]
  const rejected = shown === "rejected"
  const underReview = b.deathCase?.status === "under_review"
  const graceDays = b.graceStartedAt != null && b.gracePeriodMs != null ? daysFromNow(b.graceStartedAt + b.gracePeriodMs) : null
  const roleLabel = b.relationship ? `their ${b.relationship}` : b.role === "heir" ? "a legal heir" : "a named recipient"
  const timeline = [
    { done: true, label: `Named you as ${roleLabel}`, when: "" },
    { done: true, label: "Your key is set up", when: "ready" },
    { done: b.status !== "active", label: "Check-in missed → grace period", when: b.status === "active" ? "—" : "recently" },
    {
      done: b.status === "released",
      label: "Death verification",
      when:
        b.status === "released" ? "approved"
        : rejected ? "needs another look"
        : b.status === "pending" && b.deathCase?.status === "under_review" ? "under review"
        : b.status === "pending" ? "waiting for a report"
        : "—",
    },
    { done: b.status === "released", label: "Legacy released to you", when: b.status === "released" ? relPast(b.releaseAuthorizedAt) : "—" },
  ]

  return (
    <Page width={720} style={{ paddingTop: 26 }}>
      <Link href="/home" className="press linkrow" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ink-2)", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
        <Icon name="chevL" size={17} sw={2.4} /> Home
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
        <Avatar initials={initialsOf(b.ownerName)} tint={tintFor(b.ownerId)} size={64} />
        <div style={{ flex: 1 }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 27, fontWeight: 600, letterSpacing: -0.4 }}>{b.ownerName}</h1>
          <div style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>{roleLabel}{b.shareLabel ? ` · ${b.shareLabel}` : ""}</div>
        </div>
        <Pill tone={s.tone} icon={s.icon}>{s.label}</Pill>
      </div>

      <Card pad={20} style={{ marginBottom: 16, background: `color-mix(in oklch, ${toneColor(s.tone)} 5%, white)`, borderColor: `color-mix(in oklch, ${toneColor(s.tone)} 18%, var(--line))` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <IconBadge name={s.icon} tint={toneColor(s.tone)} size={44} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</div><div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: 1 }}>{s.desc}</div></div>
          {b.status === "active" && <Stat label="Next check-in" value={`${daysFromNow(b.nextDeadlineAt) ?? 0}d`} />}
          {b.status === "grace" && <Stat label="Grace ends" value={`${graceDays ?? 0}d`} />}
        </div>
      </Card>

      {b.status === "released" && (
        <Card pad={22} style={{ marginBottom: 16, border: "1px solid color-mix(in oklch, var(--blue) 25%, white)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--blue-soft)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="lockOpen" size={24} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15.5, fontWeight: 700 }}>Your inheritance is ready</div><div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500, marginTop: 1 }}>Opened privately on your device — only your key can.</div></div>
            <Btn variant="blue" icon="lockOpen" onClick={() => setShowRelease(true)}>View what was left</Btn>
          </div>
        </Card>
      )}

      {rejected && (
        <Card pad={22} style={{ marginBottom: 16, background: "color-mix(in oklch, var(--red-soft) 60%, white)", borderColor: "color-mix(in oklch, var(--red) 22%, var(--line))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--red-soft)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="alert" size={23} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>The report couldn&apos;t be approved</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: 2, lineHeight: 1.5 }}>A reviewer looked at the report{b.deathCase?.submittedAt ? ` from ${relPast(b.deathCase.submittedAt)}` : ""} and couldn&apos;t approve it. You can submit a corrected one.</div>
              {b.deathCase?.rejectedReason && (
                <div style={{ marginTop: 10, padding: "10px 13px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 11, fontSize: 13, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>Reviewer&apos;s note: </span>
                  {b.deathCase.rejectedReason}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 14 }}><Btn variant="gold" icon="upload" onClick={() => setShowReport(true)}>Submit a corrected report</Btn></div>
        </Card>
      )}

      {underReview && b.status !== "released" && (
        <Card pad={22} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--gold-soft)", color: "var(--gold-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="file" size={23} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>Report under review</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: 2, lineHeight: 1.5 }}>
                The death report{b.deathCase?.submittedAt ? ` from ${relPast(b.deathCase.submittedAt)}` : ""} is being checked by a reviewer. You&apos;ll be emailed the outcome — nothing more is needed from you right now.
              </div>
            </div>
          </div>
        </Card>
      )}

      {!rejected && !underReview && b.status !== "released" && (
        <Card pad={22} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--amber-soft)", color: "oklch(0.5 0.13 60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="file" size={23} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15.5, fontWeight: 700 }}>Report a death</div><div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500, marginTop: 2, lineHeight: 1.5 }}>If {b.ownerName.split(" ")[0]} has passed, you can report it and submit a death certificate — even if check-ins look healthy. Nothing is released on your word alone — a reviewer must approve it.</div></div>
          </div>
          <div style={{ marginTop: 14 }}><Btn variant="gold" icon="upload" onClick={() => setShowReport(true)}>Report &amp; submit certificate</Btn></div>
        </Card>
      )}

      {b.status !== "released" && (
        <Card pad={22} style={{ marginBottom: 16 }}>
          <SectionTitle style={{ marginBottom: 14 }}>What&apos;s reserved for you</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "var(--surface-2)", borderRadius: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface-3)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="lock" size={22} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 700 }}>{b.itemCount > 0 ? `${b.itemCount} item${b.itemCount === 1 ? "" : "s"} sealed for you` : "Sealed until release"}</div><div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 1 }}>Contents stay sealed until release — even we can&apos;t see them.</div></div>
          </div>
        </Card>
      )}

      <Card pad={22}>
        <SectionTitle style={{ marginBottom: 16 }}>Status</SectionTitle>
        <div style={{ position: "relative" }}>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < timeline.length - 1 ? 18 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.done ? "var(--green-soft)" : "var(--surface-3)", color: t.done ? "var(--green)" : "var(--ink-3)", border: t.done ? "none" : "1.5px dashed var(--line)" }}>{t.done ? <Icon name="check" size={13} sw={2.6} /> : <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--ink-3)" }} />}</div>
                {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 18, background: t.done ? "var(--green-soft)" : "var(--line-2)", marginTop: 2 }} />}
              </div>
              <div style={{ paddingTop: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: t.done ? "var(--ink)" : "var(--ink-3)" }}>{t.label}</div>{t.when && <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginTop: 1 }}>{t.when}</div>}</div>
            </div>
          ))}
        </div>
      </Card>

      {showReport && <ReportDeath beneficiaryId={b.beneficiaryId} ownerName={b.ownerName} onClose={() => setShowReport(false)} />}
      {showRelease && <ReleaseReveal ownerId={b.ownerId} ownerName={b.ownerName} onClose={() => setShowRelease(false)} />}
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{label}</div><div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{value}</div></div>
}
