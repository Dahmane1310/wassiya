"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { sendMagicCode, signInWithMagicCode, signInWithPassword } from "@/app/auth-actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { OAuthButtons } from "./oauth-buttons"

export function SignInForm({ returnTo }: { returnTo: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [mode, setMode] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
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
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setCodeSent(false)
          }}
        />
      </div>
      {mode === "password" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      ) : codeSent ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">{t("auth.codeLabel")}</Label>
          <Input
            id="code"
            inputMode="numeric"
            className="font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">{t("auth.codeHint", { email })}</p>
        </div>
      ) : null}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={
          busy ||
          !email.includes("@") ||
          (mode === "password" ? password.length === 0 : codeSent && code.trim().length < 6)
        }
      >
        {busy
          ? t("common.loading")
          : mode === "code" && !codeSent
            ? t("auth.emailCode")
            : t("auth.signIn")}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMode(mode === "password" ? "code" : "password")
            setCodeSent(false)
            setError("")
          }}
        >
          {mode === "password" ? t("auth.useCode") : t("auth.usePassword")}
        </button>
        {mode === "password" && (
          <Link href="/reset-password" className="text-muted-foreground hover:text-foreground">
            {t("auth.forgot")}
          </Link>
        )}
      </div>
      <p className="text-muted-foreground border-t pt-3 text-center text-sm">
        {t("auth.noAccount")}{" "}
        <Link href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} className="text-primary font-medium hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
    </form>
  )
}
