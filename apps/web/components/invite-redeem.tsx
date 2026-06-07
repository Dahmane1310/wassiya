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
import { Button } from "@workspace/ui/components/button"

/**
 * Beneficiary invite redemption + keypair enrollment (the web release-portal entry).
 * The recipient signs in, the invite token is consumed, and — first time only — an
 * RSA-OAEP keypair is generated IN THE BROWSER. The private half is recovery-wrapped
 * client-side; only ciphertext + the public key reach the server. The owner later
 * wraps each asset's DEK to this public key (reconciliation), so the recipient can
 * decrypt at release. Zero-knowledge: the server never sees the private key plaintext.
 */
export function InviteRedeem({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-6">
      <div>
        <h1 className="text-xl font-semibold">Accept your invitation</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;ve been named to receive someone&apos;s encrypted legacy. Set up your
          private key so their instructions can be released to you — and to no one else.
        </p>
      </div>
      <AuthLoading>
        <p className="text-muted-foreground text-sm">Checking your session…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInPrompt token={token} />
      </Unauthenticated>
      <Authenticated>
        <RedeemFlow token={token} />
      </Authenticated>
    </div>
  )
}

function SignInPrompt({ token }: { token: string }) {
  const returnTo = encodeURIComponent(`/invite/${token}`)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">Sign in or create an account to continue.</p>
      <div className="flex gap-2">
        <Button onClick={() => (window.location.href = `/sign-in?returnTo=${returnTo}`)}>
          Sign in
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = `/sign-up?returnTo=${returnTo}`)}
        >
          Create account
        </Button>
      </div>
    </div>
  )
}

type Phase = "ready" | "working" | "recovery" | "done" | "error"

function RedeemFlow({ token }: { token: string }) {
  const status = useQuery(api.recipients.getMyRecipientStatus)
  const redeem = useMutation(api.invites.redeemInvite)
  const enroll = useMutation(api.recipients.enrollKeypair)
  const [phase, setPhase] = useState<Phase>("ready")
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function accept() {
    setPhase("working")
    setError("")
    try {
      await redeem({ tokenHash: await sha256(token) })
      // Already have a keypair (named by another owner before)? Just linked — done.
      if (status?.enrolled) {
        setFingerprint(status.keyFingerprint)
        setPhase("done")
        return
      }
      const enrolled = await enrollRecipient()
      try {
        await enroll(enrolled.enrollment)
      } catch (e) {
        // Lost a race with a prior enrollment — that's fine, the link still stands.
        if (e instanceof Error && e.message.includes("ALREADY_ENROLLED")) {
          setPhase("done")
          return
        }
        throw e
      }
      setRecoveryCode(enrolled.recoveryCode)
      setFingerprint(enrolled.enrollment.keyFingerprint)
      setPhase("recovery")
    } catch (e) {
      setError(friendlyError(e))
      setPhase("error")
    }
  }

  if (status === undefined) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }
  if (phase === "recovery" && recoveryCode) {
    return (
      <RecoveryStep
        code={recoveryCode}
        fingerprint={fingerprint}
        onDone={() => setPhase("done")}
      />
    )
  }
  if (phase === "done") {
    return <DoneStep fingerprint={fingerprint} />
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={phase === "working"} onClick={accept}>
        {phase === "working" ? "Setting up…" : "Accept invitation"}
      </Button>
    </div>
  )
}

function RecoveryStep({
  code,
  fingerprint,
  onDone,
}: {
  code: string
  fingerprint: string | null
  onDone: () => void
}) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">Save your Recovery Code</h2>
      <p className="text-muted-foreground text-sm">
        This is the <strong>only</strong> way to unlock your inheritance later. Store it
        somewhere safe — it is shown once and cannot be recovered for you.
      </p>
      <code className="bg-muted block rounded p-3 text-center text-lg tracking-wider break-all">
        {code}
      </code>
      <Button
        variant="outline"
        onClick={() => void navigator.clipboard?.writeText(code)}
      >
        Copy code
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        I have saved my Recovery Code somewhere safe.
      </label>
      <Button disabled={!saved} onClick={onDone}>
        Continue
      </Button>
      {fingerprint ? <Fingerprint value={fingerprint} /> : null}
    </div>
  )
}

function DoneStep({ fingerprint }: { fingerprint: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">You&apos;re all set</h2>
      <p className="text-muted-foreground text-sm">
        Your key is enrolled. The instructions left for you will be released — encrypted
        to you and no one else — if and when the time comes.
      </p>
      {fingerprint ? <Fingerprint value={fingerprint} /> : null}
    </div>
  )
}

function Fingerprint({ value }: { value: string }) {
  return (
    <div className="bg-muted/40 rounded-md border p-3 text-xs">
      <p className="text-muted-foreground mb-1">
        Your key fingerprint — read it to the person who invited you so they can confirm
        it matches before trusting it:
      </p>
      <code className="break-all">{value}</code>
    </div>
  )
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (msg.includes("Invalid invite")) return "This invitation link isn't valid."
  if (msg.includes("already been used")) return "This invitation has already been used."
  if (msg.includes("expired")) return "This invitation has expired. Ask for a new one."
  return "Something went wrong. Please try again."
}
