import { AuthLayout } from "@/components/auth/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <AuthLayout titleKey="auth.resetTitle">
      <ResetPasswordForm token={token ?? null} />
    </AuthLayout>
  )
}
