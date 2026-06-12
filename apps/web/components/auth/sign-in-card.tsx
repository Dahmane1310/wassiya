"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { sendMagicCode, signInWithMagicCode, signInWithPassword } from "@/app/auth-actions"
import { Btn, Card, Field } from "@/components/portal/ui"
import { friendlyAuthError } from "./error-messages"
import { OAuthButtons } from "./oauth-buttons"

/** Our sign-in: email+password or a one-time email code, plus Google/Apple. */
export function SignInCard({ returnTo }: { returnTo: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      if (mode === "code" && !codeSent) {
        await sendMagicCode(email)
        setCodeSent(true)
        return
      }
      const result =
        mode === "password"
          ? await signInWithPassword(email, password)
          : await signInWithMagicCode(email, code)
      if ("ok" in result) {
        router.push(returnTo)
      } else if ("verifyEmail" in result) {
        router.push(
          `/verify-email?pending=${encodeURIComponent(result.verifyEmail.pendingAuthenticationToken)}&email=${encodeURIComponent(result.verifyEmail.email)}&returnTo=${encodeURIComponent(returnTo)}`,
        )
      } else {
        setError(friendlyAuthError(result.error))
      }
    } finally {
      setBusy(false)
    }
  }

  const canSubmit =
    email.includes("@") &&
    (mode === "password" ? password.length > 0 : !codeSent || code.trim().length >= 6)

  return (
    <Card pad={32}>
      <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
        Sign in to your Wassiya account.
      </p>

      <div style={{ marginTop: 20 }}>
        <OAuthButtons returnTo={returnTo} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Field label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setCodeSent(false) }} placeholder="you@example.com" autoFocus />
        {mode === "password" ? (
          <Field label="Password" type="password" value={password} onChange={setPassword} />
        ) : codeSent ? (
          <Field label="The 6-digit code we emailed you" value={code} onChange={setCode} mono hint={`Sent to ${email}. It can take a minute to arrive.`} />
        ) : null}

        {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>{error}</div>}

        <Btn variant="gold" size="lg" full disabled={busy || !canSubmit} onClick={() => void submit()}>
          {busy ? "One moment…" : mode === "code" && !codeSent ? "Email me a code" : "Sign in"}
        </Btn>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button
          className="press linkrow"
          style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600, background: "none", border: "none" }}
          onClick={() => { setMode(mode === "password" ? "code" : "password"); setCodeSent(false); setError("") }}
        >
          {mode === "password" ? "Email me a code instead" : "Use a password instead"}
        </button>
        {mode === "password" && (
          <Link href="/reset-password" className="linkrow" style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
            Forgot password?
          </Link>
        )}
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500, textAlign: "center" }}>
        New to Wassiya?{" "}
        <Link href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
          Create your account
        </Link>
      </div>
    </Card>
  )
}
