"use client"

import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"

export function AuthDemo() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">Auth test</h2>
      <AuthLoading>
        <p className="text-muted-foreground text-sm">Checking session…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignedOut />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </div>
  )
}

function SignedOut() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">You are signed out.</p>
      <div className="flex gap-2">
        <Button onClick={() => (window.location.href = "/sign-in")}>Sign in</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/sign-up")}>
          Sign up
        </Button>
      </div>
    </div>
  )
}

function SignedIn() {
  const { user, signOut } = useAuth()
  // This query runs against Convex with the WorkOS token attached. A non-null
  // result is the end-to-end proof that Convex authenticated the request.
  const me = useQuery(api.users.currentUser)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>
      <p className="text-muted-foreground text-xs">Convex sees this identity:</p>
      <pre className="bg-muted overflow-auto rounded p-2 text-xs">
        {me === undefined ? "loading…" : JSON.stringify(me, null, 2)}
      </pre>
      <Button variant="outline" className="self-start" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  )
}
