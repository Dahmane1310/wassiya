"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { verifyEmailCode } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { AuthCard } from "./auth-card"
import { AuthField } from "./auth-field"
import { friendlyAuthErrorKey } from "./error-messages"

export function VerifyEmailCard({
  pendingToken,
  email,
  returnTo,
}: {
  pendingToken: string
  email: string
  returnTo: string
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [errorKey, setErrorKey] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setErrorKey("")
    try {
      const result = await verifyEmailCode(pendingToken, code)
      if ("ok" in result) router.push(returnTo)
      else if ("error" in result) setErrorKey(friendlyAuthErrorKey(result.error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={t("auth.checkEmail")}
      sub={
        <>
          {t("auth.verifySub1")} <b>{email || t("auth.yourEmail")}</b>{" "}
          {t("auth.verifySub2")}
        </>
      }
    >
      <form
        className="mt-4.5"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <AuthField
          label={t("auth.verificationCode")}
          value={code}
          onChange={setCode}
          mono
          autoFocus
          hint={t("auth.codeArriveHint")}
        />
        {errorKey && (
          <div className="text-destructive mb-2.5 text-[13px] font-semibold">
            {t(errorKey)}
          </div>
        )}
        <Button size="xl" className="w-full" disabled={busy || code.trim().length < 6} onClick={() => void submit()}>
          {busy ? t("auth.oneMoment") : t("auth.confirm")}
        </Button>
      </form>
    </AuthCard>
  )
}
