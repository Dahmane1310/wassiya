import { AuthShell } from "@/components/auth/auth-shell"
import { VerifyEmailCard } from "@/components/auth/verify-email-card"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string; email?: string; returnTo?: string }>
}) {
  const { pending, email, returnTo } = await searchParams
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/home"
  return (
    <AuthShell>
      <VerifyEmailCard
        pendingToken={pending ?? ""}
        email={email ?? ""}
        returnTo={safeReturnTo}
      />
    </AuthShell>
  )
}
