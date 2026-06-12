import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpCard } from "@/components/auth/sign-up-card"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/home"
  return (
    <AuthShell>
      <SignUpCard returnTo={safeReturnTo} />
    </AuthShell>
  )
}
