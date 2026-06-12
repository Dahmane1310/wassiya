"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { signUpWithPassword } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { OAuthButtons } from "./oauth-buttons"
import { Separator } from "@workspace/ui/components/separator"

export function SignUpForm({ returnTo }: { returnTo: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const result = await signUpWithPassword(email, password)
      if ("ok" in result) {
        router.push(returnTo)
      } else if ("verifyEmail" in result) {
        router.push(
          `/verify-email?pending=${encodeURIComponent(result.verifyEmail.pendingAuthenticationToken)}&email=${encodeURIComponent(result.verifyEmail.email)}&returnTo=${encodeURIComponent(returnTo)}`,
        )
      } else {
        setError(t(`auth.errors.${result.error}`, { defaultValue: t("auth.errors.auth_failed") }))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <OAuthButtons returnTo={returnTo} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">{t("auth.orEmail")}</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("auth.passwordHint")}</p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !email.includes("@") || password.length < 8}>
        {busy ? t("common.loading") : t("auth.createAccount")}
      </Button>
      <p className="text-muted-foreground border-t pt-3 text-center text-sm">
        {t("auth.haveAccount")}{" "}
        <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="text-primary font-medium hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  )
}
