import { useState } from "react"
import { ActivityIndicator, Pressable, TextInput, View } from "react-native"
import { Eye, EyeOff, LockKeyhole } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { useBrandType } from "@/hooks/use-brand-type"
import { type WorkOSTokens } from "@/lib/auth"
import {
  AuthProxyError,
  passwordSignIn,
  passwordSignUp,
  requestPasswordReset,
} from "@/lib/auth-proxy"
import { useThemeColors } from "@/lib/colors"
import { AuthNote } from "./auth-note"
import { StepHero } from "./step-hero"

type Props = {
  email: string
  onTokens: (tokens: WorkOSTokens) => Promise<void>
  onVerify: (pendingToken: string) => void
  onEditEmail: () => void
}

/** Step 2 (password path): sign in or create the account. */
export function PasswordStep({ email, onTokens, onVerify, onEditEmail }: Props) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const c = useThemeColors()
  const [creating, setCreating] = useState(false)
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const result = creating
        ? await passwordSignUp(email, password)
        : await passwordSignIn(email, password)
      if ("tokens" in result) await onTokens(result.tokens)
      else onVerify(result.pendingAuthenticationToken)
    } catch (e) {
      const code = e instanceof AuthProxyError ? e.code : "auth_failed"
      setError(t(`auth.errors.${code}`, { defaultValue: t("auth.errors.auth_failed") }))
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    await requestPasswordReset(email)
    setResetSent(true)
  }

  return (
    <View className="gap-7">
      <StepHero
        title={creating ? t("auth.createTitle") : t("auth.passwordTitle")}
        pill={{
          label: email,
          onPress: onEditEmail,
          accessibilityLabel: t("auth.emailLabel"),
        }}
      />

      <View>
        <Field label={t("auth.passwordLabel")}>
          <Icon as={LockKeyhole} size={18} className="text-ink-3" />
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              if (error) setError("")
            }}
            placeholder="••••••••••"
            placeholderTextColor={c.ink3}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            className="h-full flex-1 font-sans text-[15.5px] text-foreground"
          />
          <Pressable onPress={() => setShow(!show)} hitSlop={8}>
            <Icon as={show ? EyeOff : Eye} size={19} className="text-ink-3" />
          </Pressable>
        </Field>

        <View className="gap-2.5">
          {creating && (
            <Text variant="muted" className={cn("-mt-1 px-1 text-[12.5px]", body)}>
              {t("auth.passwordHint")}
            </Text>
          )}
          {error !== "" && <AuthNote tone="error">{error}</AuthNote>}
          {resetSent && <AuthNote tone="success">{t("auth.resetSent")}</AuthNote>}
          <Button
            variant="vault"
            size="lg"
            className="h-[54px] rounded-2xl"
            disabled={busy || password.length < (creating ? 8 : 1)}
            onPress={() => void submit()}
            accessibilityLabel={creating ? t("auth.createAccount") : t("auth.signIn")}
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={cn("font-heading text-white", ar ? body : undefined)}>
                {creating ? t("auth.createAccount") : t("auth.signIn")}
              </Text>
            )}
          </Button>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Button
            variant="link"
            onPress={() => {
              setCreating(!creating)
              setError("")
            }}
          >
            <Text className={ar ? body : undefined}>
              {creating ? t("auth.haveAccount") : t("auth.newHere")}
            </Text>
          </Button>
          {!creating && (
            <Button variant="link" onPress={() => void forgot()}>
              <Text className={ar ? body : undefined}>{t("auth.forgot")}</Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}
