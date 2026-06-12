import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/sign-in-form"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/"
  return (
    <AuthLayout titleKey="auth.signInTitle" subtitleKey="auth.signInSubtitle">
      <SignInForm returnTo={safeReturnTo} />
    </AuthLayout>
  )
}
