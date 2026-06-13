"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { sendMagicCode, signInWithMagicCode, signInWithPassword } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { AuthCard } from "./auth-card"
import { AuthField } from "./auth-field"
import { friendlyAuthErrorKey } from "./error-messages"
import { OAuthButtons } from "./oauth-buttons"

/** Our sign-in: email+password or a one-time email code, plus Google/Apple. */
export function SignInCard({ returnTo }: { returnTo: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [mode, setMode] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [errorKey, setErrorKey] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setErrorKey("")
    try {
      if (mode === "code" && !codeSent) {
        await sendMagicCode(email)
        setCodeSent(true)
        return
      }
      const result =
        mode === "password"
          ? await signInWithPassword(email, password)
          : await signInWithMagicCode(email, code)
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

  const canSubmit =
    email.includes("@") &&
    (mode === "password" ? password.length > 0 : !codeSent || code.trim().length >= 6)

  return (
    <AuthCard title={t("auth.welcomeBack")} sub={t("auth.signInSub")}>
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
        <AuthField label={t("auth.email")} type="email" value={email} onChange={(v) => { setEmail(v); setCodeSent(false) }} placeholder={t("auth.emailPlaceholder")} autoFocus />
        {mode === "password" ? (
          <AuthField label={t("auth.password")} type="password" value={password} onChange={setPassword} />
        ) : codeSent ? (
          <AuthField label={t("auth.codeLabel")} value={code} onChange={setCode} mono hint={t("auth.codeSentHint", { email })} />
        ) : null}

        {errorKey && (
          <div className="text-destructive mb-2.5 text-[13px] font-semibold">
            {t(errorKey)}
          </div>
        )}

        <Button size="xl" className="w-full" disabled={busy || !canSubmit} onClick={() => void submit()}>
          {busy
            ? t("auth.oneMoment")
            : mode === "code" && !codeSent
              ? t("auth.emailMeCode")
              : t("auth.signIn")}
        </Button>
      </form>

      <div className="mt-3.5 flex justify-between">
        <button
          type="button"
          className="press text-foreground/70 hover:text-primary text-[13px] font-semibold transition-colors"
          onClick={() => { setMode(mode === "password" ? "code" : "password"); setCodeSent(false); setErrorKey("") }}
        >
          {mode === "password" ? t("auth.emailCodeInstead") : t("auth.usePasswordInstead")}
        </button>
        {mode === "password" && (
          <Link href="/reset-password" className="text-foreground/70 hover:text-primary text-[13px] font-semibold transition-colors">
            {t("auth.forgotPassword")}
          </Link>
        )}
      </div>

      <div className="text-foreground/70 mt-4.5 border-t pt-4 text-center text-[13.5px]">
        {t("auth.newToWassiya")}{" "}
        <Link href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} className="text-primary font-bold">
          {t("auth.createYourAccount")}
        </Link>
      </div>
    </AuthCard>
  )
}
