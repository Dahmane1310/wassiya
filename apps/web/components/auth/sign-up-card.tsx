"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signUpWithPassword } from "@/app/auth-actions"
import { Btn, Card, Field } from "@/components/portal/ui"
import { friendlyAuthError } from "./error-messages"
import { OAuthButtons } from "./oauth-buttons"

export function SignUpCard({ returnTo }: { returnTo: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const result = await signUpWithPassword(email, password, firstName)
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

  return (
    <Card pad={32}>
      <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>Create your account</h1>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
        A few seconds now — a lifetime of peace of mind.
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
        <Field label="First name (optional)" value={firstName} onChange={setFirstName} placeholder="Your name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} hint="At least 10 characters keeps it strong." />

        {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>{error}</div>}

        <Btn variant="gold" size="lg" full disabled={busy || !email.includes("@") || password.length < 8} onClick={() => void submit()}>
          {busy ? "One moment…" : "Create account"}
        </Btn>
      </form>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500, textAlign: "center" }}>
        Already have an account?{" "}
        <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
          Sign in
        </Link>
      </div>
    </Card>
  )
}
