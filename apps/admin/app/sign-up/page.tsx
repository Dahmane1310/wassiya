import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/"
  return (
    <AuthLayout titleKey="auth.signUpTitle" subtitleKey="auth.signUpSubtitle">
      <SignUpForm returnTo={safeReturnTo} />
    </AuthLayout>
  )
}
