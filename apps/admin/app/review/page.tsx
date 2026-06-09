"use client"

import { useState } from "react"
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"

export default function ReviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-semibold">Death verification review</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Approve only a valid, verified death certificate — approval authorizes release of the
        owner&apos;s estate to their beneficiaries.
      </p>
      <div className="mt-6">
        <AuthLoading>
          <p className="text-muted-foreground text-sm">Checking session…</p>
        </AuthLoading>
        <Unauthenticated>
          <Button onClick={() => (window.location.href = "/sign-in")}>Sign in</Button>
        </Unauthenticated>
        <Authenticated>
          <Queue />
        </Authenticated>
      </div>
    </main>
  )
}

function Queue() {
  const rows = useQuery(api.release.listReviewQueue)
  if (rows === undefined) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (rows.length === 0)
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        Nothing awaiting review. (If you expect items here, ensure your account is in the
        <code className="mx-1">admins</code> allowlist.)
      </p>
    )
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <ReviewRow key={r._id} row={r} />
      ))}
    </div>
  )
}

function ReviewRow({
  row,
}: {
  row: {
    _id: Id<"deathVerification">
    ownerId: string
    submittedByEmail: string | null
    hasCertificate: boolean
  }
}) {
  const review = useMutation(api.release.reviewDeathVerification)
  const certUrl = useQuery(api.release.getCertUrl, row.hasCertificate ? { id: row._id } : "skip")
  const [busy, setBusy] = useState(false)

  async function decide(decision: "approved" | "rejected") {
    setBusy(true)
    try {
      await review({ id: row._id, decision })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-sm">
          <div className="font-medium">Owner</div>
          <div className="text-muted-foreground truncate font-mono text-xs">{row.ownerId}</div>
          <div className="mt-2">
            Submitted by{" "}
            <span className="font-medium">{row.submittedByEmail ?? "unknown"}</span>
          </div>
        </div>
        <div className="shrink-0">
          {row.hasCertificate ? (
            certUrl ? (
              <a className="text-sm font-medium underline" href={certUrl} target="_blank" rel="noreferrer">
                View certificate
              </a>
            ) : (
              <span className="text-muted-foreground text-xs">loading cert…</span>
            )
          ) : (
            <span className="text-muted-foreground text-xs">no certificate</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => decide("approved")}>
          Approve &amp; authorize release
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => decide("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  )
}
