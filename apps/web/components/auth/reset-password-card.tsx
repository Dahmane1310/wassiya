"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { completePasswordReset, requestPasswordReset } from "@/app/auth-actions"
import { Btn, Card, Field } from "@/components/portal/ui"
import { friendlyAuthError } from "./error-messages"

/** Without a token: request a reset link. With ?token=: choose a new password. */
export function ResetPasswordCard({ token }: { token: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      if (token === null) {
        await requestPasswordReset(email)
        setSent(true)
        return
      }
      const result = await completePasswordReset(token, password)
      if ("ok" in result) router.push("/home")
      else if ("error" in result) setError(friendlyAuthError(result.error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card pad={32}>
      <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>
        {token === null ? "Reset your password" : "Choose a new password"}
      </h1>
      {token === null ? (
        sent ? (
          <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10, fontWeight: 500, lineHeight: 1.55 }}>
            If an account exists for <b>{email}</b>, a reset link is on its way.
            Open it on this device to choose a new password.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send you a link to choose a new one.
            </p>
            <form style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); void submit() }}>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
              <Btn variant="gold" size="lg" full disabled={busy || !email.includes("@")} onClick={() => void submit()}>
                {busy ? "One moment…" : "Send reset link"}
              </Btn>
            </form>
          </>
        )
      ) : (
        <>
          <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
            Pick a new password for your account.
          </p>
          <form style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); void submit() }}>
            <Field label="New password" type="password" value={password} onChange={setPassword} hint="At least 10 characters keeps it strong." autoFocus />
            {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>{error}</div>}
            <Btn variant="gold" size="lg" full disabled={busy || password.length < 8} onClick={() => void submit()}>
              {busy ? "One moment…" : "Save & sign in"}
            </Btn>
          </form>
        </>
      )}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13.5, fontWeight: 500, textAlign: "center" }}>
        <Link href="/sign-in" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Back to sign in
        </Link>
      </div>
    </Card>
  )
}
