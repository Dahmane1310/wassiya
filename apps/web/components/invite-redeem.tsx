"use client"

import { useState } from "react"
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react"
import { api } from "@workspace/backend/api"
import { enrollRecipient, sha256 } from "@workspace/crypto"
import { Btn, Card, IconBadge, Pill } from "@/components/portal/ui"
import { Icon } from "@/components/portal/icon"
import { Logo, Wordmark } from "@/components/portal/logo"
import { PrivacyLink } from "@/components/portal/privacy-explainer"

/**
 * Beneficiary invite redemption + key setup (the web release-portal entry).
 * Unauthenticated → a branded sign-in panel → WorkOS. Authenticated → the invite is
 * accepted and, first time only, the recipient's key is created IN THE BROWSER; the
 * private part is backed up by their recovery code (only the locked version reaches
 * the server). Copy is plain by design — the security mechanics live in PrivacyLink.
 */
export function InviteRedeem({ token }: { token: string }) {
  return (
    <div className="portal">
      <AuthLoading>
        <Centered>
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Checking your session…</p>
        </Centered>
      </AuthLoading>
      <Unauthenticated>
        <SignInPanel token={token} />
      </Unauthenticated>
      <Authenticated>
        <EnrollFlow token={token} />
      </Authenticated>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "radial-gradient(900px 600px at 50% -10%, var(--gold-soft), transparent 55%), var(--bg)" }}>
      <div className="w-up" style={{ width: 460, maxWidth: "100%" }}>{children}</div>
    </div>
  )
}

function SignInPanel({ token }: { token: string }) {
  const returnTo = encodeURIComponent(`/invite/${token}`)
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div style={{ background: "radial-gradient(700px 500px at 30% 0%, oklch(0.3 0.02 60), transparent 60%), linear-gradient(160deg, var(--sidebar), oklch(0.14 0.01 60))", color: "#fff", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark size={44} />
        <div>
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.12, letterSpacing: -0.6, margin: 0 }}>Someone trusted you<br />with what matters most.</h1>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6, marginTop: 16, fontWeight: 500, maxWidth: 380 }}>You&apos;ve been chosen to receive a loved one&apos;s legacy. Sign in to get set up — so their wishes reach you, and no one else.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          <Icon name="shieldCheck" size={17} style={{ color: "var(--gold)" }} /> Private — only you can open it
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div className="w-up" style={{ width: 360, maxWidth: "100%" }}>
          <h2 className="serif" style={{ fontSize: 27, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Accept your invitation</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>Sign in or create an account to continue. Signing in gets you into your account; a separate step keeps your legacy private to you.</p>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 11 }}>
            <Btn variant="gold" size="lg" full onClick={() => (window.location.href = `/sign-in?returnTo=${returnTo}`)}>Sign in</Btn>
            <Btn variant="ghost" size="lg" full onClick={() => (window.location.href = `/sign-up?returnTo=${returnTo}`)}>Create account</Btn>
          </div>
          <div style={{ marginTop: 18, fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", fontWeight: 500, lineHeight: 1.5 }}>By continuing you agree to Wassiya&apos;s Terms &amp; Privacy. We can never see what&apos;s inside.</div>
        </div>
      </div>
    </div>
  )
}

type Step = "intro" | "generating" | "recovery" | "fingerprint" | "done" | "error"

function EnrollFlow({ token }: { token: string }) {
  const status = useQuery(api.recipients.getMyRecipientStatus)
  const redeem = useMutation(api.invites.redeemInvite)
  const enroll = useMutation(api.recipients.enrollKeypair)
  const [step, setStep] = useState<Step>("intro")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [fingerprint, setFingerprint] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function start() {
    setStep("generating")
    setError("")
    try {
      await redeem({ tokenHash: await sha256(token) })
      if (status?.enrolled) {
        setFingerprint(status.keyFingerprint ?? "")
        setStep("done")
        return
      }
      const { enrollment, recoveryCode } = await enrollRecipient()
      try {
        await enroll(enrollment)
      } catch (e) {
        if (e instanceof Error && e.message.includes("ALREADY_ENROLLED")) {
          setStep("done")
          return
        }
        throw e
      }
      setRecoveryCode(recoveryCode)
      setFingerprint(enrollment.keyFingerprint)
      setStep("recovery")
    } catch (e) {
      setError(friendlyError(e))
      setStep("error")
    }
  }

  if (status === undefined) {
    return <Centered><p style={{ fontSize: 14, color: "var(--ink-2)" }}>Loading…</p></Centered>
  }

  if (step === "intro" || step === "error") {
    return (
      <Centered>
        <Card pad={32}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Logo size={56} /></div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0, textAlign: "center" }}>Set up your key</h1>
          <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 10, fontWeight: 500, textAlign: "center" }}>Someone has entrusted you with their legacy. Your key is a private code, kept only on this device, that lets you open what&apos;s left for you — and no one else can, not even us.</p>
          <div style={{ margin: "22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { i: "lock" as const, t: "Created on your device", s: "It's yours alone and never leaves this device unprotected." },
              { i: "refresh" as const, t: "Backed up by a recovery code", s: "A recovery code lets you restore it on any device, for years." },
              { i: "check" as const, t: "Confirmed it's really you", s: "You'll read a short verification code to them so they know it's you." },
            ].map((x) => (
              <div key={x.t} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <IconBadge name={x.i} tint="var(--primary)" size={40} />
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{x.t}</div><div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 1 }}>{x.s}</div></div>
              </div>
            ))}
          </div>
          {error && <div style={{ marginBottom: 12, fontSize: 13, color: "var(--red)", fontWeight: 600, textAlign: "center" }}>{error}</div>}
          <Btn variant="gold" size="lg" full icon="key" onClick={start}>Set up my key</Btn>
          <div style={{ marginTop: 14, textAlign: "center" }}><PrivacyLink /></div>
        </Card>
      </Centered>
    )
  }

  if (step === "generating") {
    return (
      <Centered>
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 16px" }}>
            {[0, 1].map((i) => (<span key={i} style={{ position: "absolute", inset: 18, borderRadius: 99, border: "2px solid var(--primary)", animation: `wPulse 1.8s ${i * 0.9}s ease-out infinite` }} />))}
            <div style={{ width: 96, height: 96, borderRadius: 99, background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", animation: "wHeart 2s ease-in-out infinite" }}><Icon name="key" size={42} /></div>
          </div>
          <div className="serif" style={{ fontSize: 21, fontWeight: 600 }}>Setting up your key…</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 6, fontWeight: 500 }}>Created privately on your device · never sent to us</div>
        </div>
      </Centered>
    )
  }

  if (step === "recovery") {
    return (
      <Centered>
        <Card pad={32}>
          <Pill tone="amber" icon="alert">Save this now</Pill>
          <h1 className="serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3, margin: "14px 0 0" }}>Your Recovery Code</h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 8, fontWeight: 500 }}>This is the <b>only</b> key to everything left for you. Save it somewhere you&apos;ll still have it in years — a password manager, written down and kept safe.</p>
          <div className="mono" style={{ background: "var(--sidebar)", color: "#fff", borderRadius: 13, padding: 18, textAlign: "center", fontSize: 18, fontWeight: 600, letterSpacing: 1, margin: "18px 0", wordBreak: "break-all" }}>{recoveryCode}</div>
          <Btn variant="ghost" full icon="copy" style={{ marginBottom: 14 }} onClick={() => void navigator.clipboard?.writeText(recoveryCode)}>Copy code</Btn>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 13, background: "var(--red-soft)", borderRadius: 12, marginBottom: 14 }}>
            <Icon name="alert" size={17} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: "var(--red)", fontWeight: 600, lineHeight: 1.5 }}>If you lose it, no one can recover it — not Wassiya, and not even after the person who named you has passed. Their legacy to you would be lost.</span>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16, lineHeight: 1.4 }}>
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }} /> I&apos;ve saved it, and I understand it&apos;s the only copy and can never be recovered.
          </label>
          <Btn variant="gold" size="lg" full disabled={!saved} onClick={() => setStep("fingerprint")}>Continue</Btn>
        </Card>
      </Centered>
    )
  }

  if (step === "fingerprint") {
    return (
      <Centered>
        <Card pad={32}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><div style={{ width: 60, height: 60, borderRadius: 15, background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={30} /></div></div>
          <h1 className="serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3, margin: "8px 0 0", textAlign: "center" }}>Confirm it&apos;s really you</h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 8, fontWeight: 500, textAlign: "center" }}>Read this verification code to the person who entrusted you — in person or on a call — so they know it&apos;s really you, and that no one stepped in.</p>
          <div className="mono" style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 13, padding: 18, textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 0.5, margin: "18px 0", wordBreak: "break-all" }}>{fingerprint}</div>
          <Btn variant="gold" size="lg" full icon="check" onClick={() => setStep("done")}>Done — they confirmed it matches</Btn>
        </Card>
      </Centered>
    )
  }

  return (
    <Centered>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 96, height: 96, borderRadius: 99, background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", animation: "wPop .6s ease" }}><Icon name="shieldCheck" size={48} sw={1.7} /></div>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>You&apos;re all set</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 10, fontWeight: 500, maxWidth: 380, margin: "10px auto 0" }}>Your key is ready. What&apos;s left for you will be released privately — to you and no one else — if and when the time comes.</p>
        <div style={{ marginTop: 26 }}><Btn variant="primary" size="lg" icon="home" onClick={() => (window.location.href = "/home")}>Go to my home</Btn></div>
      </div>
    </Centered>
  )
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (msg.includes("Invalid invite")) return "This invitation link isn't valid."
  if (msg.includes("already been used")) return "This invitation has already been used."
  if (msg.includes("expired")) return "This invitation has expired. Ask for a new one."
  return "Something went wrong. Please try again."
}
