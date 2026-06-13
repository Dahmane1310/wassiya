"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { completePasswordReset, requestPasswordReset } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { AuthCard } from "./auth-card"
import { AuthField } from "./auth-field"
import { friendlyAuthErrorKey } from "./error-messages"

/** Without a token: request a reset link. With ?token=: choose a new password. */
export function ResetPasswordCard({ token }: { token: string | null }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [errorKey, setErrorKey] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setErrorKey("")
    try {
      if (token === null) {
        await requestPasswordReset(email)
        setSent(true)
        return
      }
      const result = await completePasswordReset(token, password)
      if ("ok" in result) router.push("/home")
      else if ("error" in result) setErrorKey(friendlyAuthErrorKey(result.error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title={token === null ? t("auth.resetTitle") : t("auth.choosePasswordTitle")}>
      {token === null ? (
        sent ? (
          <p className="text-foreground/70 mt-2.5 text-sm leading-relaxed">
            {t("auth.resetSent1")} <b>{email}</b>
            {t("auth.resetSent2")}
          </p>
        ) : (
          <>
            <p className="text-foreground/70 mt-2 text-sm leading-normal">
              {t("auth.resetBody")}
            </p>
            <form
              className="mt-4.5"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <AuthField label={t("auth.email")} type="email" value={email} onChange={setEmail} placeholder={t("auth.emailPlaceholder")} autoFocus />
              <Button size="xl" className="w-full" disabled={busy || !email.includes("@")} onClick={() => void submit()}>
                {busy ? t("auth.oneMoment") : t("auth.sendResetLink")}
              </Button>
            </form>
          </>
        )
      ) : (
        <>
          <p className="text-foreground/70 mt-2 text-sm leading-normal">
            {t("auth.pickNewPassword")}
          </p>
          <form
            className="mt-4.5"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <AuthField label={t("auth.newPassword")} type="password" value={password} onChange={setPassword} hint={t("auth.passwordHint")} autoFocus />
            {errorKey && (
              <div className="text-destructive mb-2.5 text-[13px] font-semibold">
                {t(errorKey)}
              </div>
            )}
            <Button size="xl" className="w-full" disabled={busy || password.length < 8} onClick={() => void submit()}>
              {busy ? t("auth.oneMoment") : t("auth.saveSignIn")}
            </Button>
          </form>
        </>
      )}
      <div className="mt-4.5 border-t pt-4 text-center text-[13.5px]">
        <Link href="/sign-in" className="text-primary font-bold">
          {t("auth.backToSignIn")}
        </Link>
      </div>
    </AuthCard>
  )
}
