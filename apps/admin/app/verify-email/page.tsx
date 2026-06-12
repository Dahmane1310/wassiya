import { AuthLayout } from "@/components/auth/auth-layout"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string; email?: string; returnTo?: string }>
}) {
  const { pending, email, returnTo } = await searchParams
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/"
  return (
    <AuthLayout titleKey="auth.verifyTitle">
      <VerifyEmailForm pendingToken={pending ?? ""} email={email ?? ""} returnTo={safeReturnTo} />
    </AuthLayout>
  )
}
