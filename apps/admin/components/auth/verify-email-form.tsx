"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { verifyEmailCode } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function VerifyEmailForm({
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
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const result = await verifyEmailCode(pendingToken, code)
      if ("ok" in result) router.push(returnTo)
      else if ("error" in result) {
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
      <p className="text-muted-foreground text-sm">{t("auth.verifyBody", { email })}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">{t("auth.codeLabel")}</Label>
        <Input
          id="code"
          inputMode="numeric"
          className="font-mono"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || code.trim().length < 6}>
        {busy ? t("common.loading") : t("auth.confirm")}
      </Button>
    </form>
  )
}
