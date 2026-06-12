import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { type WorkOSTokens } from "@/lib/auth"
import {
  AuthProxyError,
  magicSignIn,
  sendMagicCode,
  verifyEmailCode,
} from "@/lib/auth-proxy"
import { AuthNote } from "./auth-note"
import { CodeBoxes } from "./code-boxes"
import { StepHero } from "./step-hero"

type Props = {
  /** "magic" = one-time sign-in code; "verify" = confirm a new account's email. */
  variant: "magic" | "verify"
  email: string
  pendingToken?: string
  onTokens: (tokens: WorkOSTokens) => Promise<void>
}

/** The 6-digit code entry, shared by magic sign-in and email verification.
 *  Submits itself the moment the sixth digit lands. */
export function CodeStep({ variant, email, pendingToken, onTokens }: Props) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)

  async function submit(value: string) {
    setBusy(true)
    setError("")
    try {
      const result =
        variant === "magic"
          ? await magicSignIn(email, value)
          : await verifyEmailCode(pendingToken ?? "", value)
      if ("tokens" in result) await onTokens(result.tokens)
      else {
        setError(t("auth.errors.auth_failed"))
        setCode("")
      }
    } catch (e) {
      const errCode = e instanceof AuthProxyError ? e.code : "auth_failed"
      setError(t(`auth.errors.${errCode}`, { defaultValue: t("auth.errors.auth_failed") }))
      setCode("")
    } finally {
      setBusy(false)
    }
  }

  function onChange(next: string) {
    setCode(next)
    if (error) setError("")
    if (next.length === 6 && !busy) void submit(next)
  }

  async function resend() {
    if (variant !== "magic") return
    setResent(true)
    await sendMagicCode(email)
  }

  return (
    <View className="gap-7">
      <StepHero
        title={variant === "magic" ? t("auth.codeTitle") : t("auth.verifyTitle")}
        subhead={t("auth.codeSubhead", { email })}
      />

      <View className="gap-4">
        <CodeBoxes
          value={code}
          onChange={onChange}
          accessibilityLabel={t("auth.codeLabel")}
        />
        {error !== "" && <AuthNote tone="error">{error}</AuthNote>}
        {resent && <AuthNote tone="success">{t("auth.codeResent")}</AuthNote>}
        <Button
          variant="vault"
          size="lg"
          className="h-[54px] rounded-2xl"
          disabled={busy || code.length < 6}
          onPress={() => void submit(code)}
          accessibilityLabel={t("auth.confirm")}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={cn("font-heading text-white", ar ? body : undefined)}>
              {t("auth.confirm")}
            </Text>
          )}
        </Button>
        {variant === "magic" && !resent && (
          <Button variant="link" onPress={() => void resend()}>
            <Text className={ar ? body : undefined}>{t("auth.resendCode")}</Text>
          </Button>
        )}
      </View>
    </View>
  )
}
