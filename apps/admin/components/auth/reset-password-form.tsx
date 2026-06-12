"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { completePasswordReset, requestPasswordReset } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function ResetPasswordForm({ token }: { token: string | null }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      if (token === null) {
        await requestPasswordReset(email)
        setSent(true)
        return
      }
      const result = await completePasswordReset(token, password)
      if ("ok" in result) router.push("/")
      else if ("error" in result) {
        setError(t(`auth.errors.${result.error}`, { defaultValue: t("auth.errors.auth_failed") }))
      }
    } finally {
      setBusy(false)
    }
  }

  if (token === null && sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">{t("auth.resetSent", { email })}</p>
        <Link href="/sign-in" className="text-primary text-center text-sm font-medium hover:underline">
          {t("auth.backToSignIn")}
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      {token === null ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth.newPassword")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">{t("auth.passwordHint")}</p>
        </div>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={busy || (token === null ? !email.includes("@") : password.length < 8)}
      >
        {busy ? t("common.loading") : token === null ? t("auth.sendReset") : t("auth.saveSignIn")}
      </Button>
      <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-center text-sm">
        {t("auth.backToSignIn")}
      </Link>
    </form>
  )
}
