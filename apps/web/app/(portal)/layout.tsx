"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { TopNav } from "@/components/portal/top-nav"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal" style={{ minHeight: "100vh", background: "radial-gradient(1000px 700px at 85% -10%, var(--gold-soft), transparent 50%), var(--bg)" }}>
      <AuthLoading>
        <Centered>Checking your session…</Centered>
      </AuthLoading>
      <Unauthenticated>
        <SignInRedirect />
      </Unauthenticated>
      <Authenticated>
        <TopNav />
        {children}
      </Authenticated>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--ink-2)", fontWeight: 500 }}>{children}</div>
}

function SignInRedirect() {
  const pathname = usePathname()
  useEffect(() => {
    window.location.href = `/sign-in?returnTo=${encodeURIComponent(pathname || "/home")}`
  }, [pathname])
  return <Centered>Redirecting to sign in…</Centered>
}
