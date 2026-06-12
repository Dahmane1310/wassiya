"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { verifyEmailCode } from "@/app/auth-actions"
import { Btn, Card, Field } from "@/components/portal/ui"
import { friendlyAuthError } from "./error-messages"

export function VerifyEmailCard({
  pendingToken,
  email,
  returnTo,
}: {
  pendingToken: string
  email: string
  returnTo: string
}) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const result = await verifyEmailCode(pendingToken, code)
      if ("ok" in result) router.push(returnTo)
      else if ("error" in result) setError(friendlyAuthError(result.error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card pad={32}>
      <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>Check your email</h1>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, fontWeight: 500, lineHeight: 1.55 }}>
        We sent a 6-digit code to <b>{email || "your email"}</b> to confirm it&apos;s
        really you. Enter it below.
      </p>
      <form
        style={{ marginTop: 18 }}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Field label="Verification code" value={code} onChange={setCode} mono autoFocus hint="It can take a minute to arrive — check spam too." />
        {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>{error}</div>}
        <Btn variant="gold" size="lg" full disabled={busy || code.trim().length < 6} onClick={() => void submit()}>
          {busy ? "One moment…" : "Confirm"}
        </Btn>
      </form>
    </Card>
  )
}
