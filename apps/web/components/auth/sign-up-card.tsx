"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { signUpWithPassword } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { AuthCard } from "./auth-card"
import { AuthField } from "./auth-field"
import { friendlyAuthErrorKey } from "./error-messages"
import { OAuthButtons } from "./oauth-buttons"

export function SignUpCard({ returnTo }: { returnTo: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorKey, setErrorKey] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setErrorKey("")
    try {
      const result = await signUpWithPassword(email, password, firstName)
      if ("ok" in result) {
        router.push(returnTo)
      } else if ("verifyEmail" in result) {
        router.push(
          `/verify-email?pending=${encodeURIComponent(result.verifyEmail.pendingAuthenticationToken)}&email=${encodeURIComponent(result.verifyEmail.email)}&returnTo=${encodeURIComponent(returnTo)}`,
        )
      } else {
        setErrorKey(friendlyAuthErrorKey(result.error))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title={t("auth.createYourAccount")} sub={t("auth.createSub")}>
      <div className="mt-5">
        <OAuthButtons returnTo={returnTo} />
      </div>
      <div className="my-4.5 flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-semibold">
          {t("auth.orWithEmail")}
        </span>
        <div className="bg-border h-px flex-1" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <AuthField label={t("auth.firstNameOptional")} value={firstName} onChange={setFirstName} placeholder={t("auth.yourNamePlaceholder")} />
        <AuthField label={t("auth.email")} type="email" value={email} onChange={setEmail} placeholder={t("auth.emailPlaceholder")} />
        <AuthField label={t("auth.password")} type="password" value={password} onChange={setPassword} hint={t("auth.passwordHint")} />

        {errorKey && (
          <div className="text-destructive mb-2.5 text-[13px] font-semibold">
            {t(errorKey)}
          </div>
        )}

        <Button
          size="xl"
          className="w-full"
          disabled={busy || !email.includes("@") || password.length < 8}
          onClick={() => void submit()}
        >
          {busy ? t("auth.oneMoment") : t("auth.createAccount")}
        </Button>
      </form>

      <div className="text-foreground/70 mt-4.5 border-t pt-4 text-center text-[13.5px]">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="text-primary font-bold">
          {t("auth.signIn")}
        </Link>
      </div>
    </AuthCard>
  )
}
