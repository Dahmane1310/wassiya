import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <AuthShell>
      <ResetPasswordCard token={token ?? null} />
    </AuthShell>
  )
}
