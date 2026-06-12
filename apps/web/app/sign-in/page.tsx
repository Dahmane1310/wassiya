import { AuthShell } from "@/components/auth/auth-shell"
import { SignInCard } from "@/components/auth/sign-in-card"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  // Only same-origin paths — never an absolute URL someone pasted in.
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/home"
  return (
    <AuthShell>
      <SignInCard returnTo={safeReturnTo} />
    </AuthShell>
  )
}
