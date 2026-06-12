import { useState } from "react"
import { ActivityIndicator, TextInput, View } from "react-native"
import { Mail } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { useBrandType } from "@/hooks/use-brand-type"
import { sendMagicCode } from "@/lib/auth-proxy"
import { useThemeColors } from "@/lib/colors"
import { AuthNote } from "./auth-note"
import { StepHero } from "./step-hero"

type Props = {
  onPassword: (email: string) => void
  onMagicSent: (email: string) => void
}

/** Step 1: the email, then choose password or a one-time code. */
export function EmailStep({ onPassword, onMagicSent }: Props) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const c = useThemeColors()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const valid = /^\S+@\S+\.\S+$/.test(email.trim())

  async function onCode() {
    setBusy(true)
    setError(false)
    try {
      await sendMagicCode(email.trim())
      onMagicSent(email.trim())
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="gap-7">
      <StepHero title={t("auth.emailTitle")} subhead={t("auth.emailSubhead")} />

      <View>
        <Field label={t("auth.emailLabel")}>
          <Icon as={Mail} size={18} className="text-ink-3" />
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v)
              if (error) setError(false)
            }}
            placeholder={t("auth.emailPlaceholder")}
            placeholderTextColor={c.ink3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoFocus
            className="h-full flex-1 font-sans text-[15.5px] text-foreground"
          />
        </Field>

        <View className="gap-2.5">
          {error && <AuthNote tone="error">{t("auth.errors.network")}</AuthNote>}
          <Button
            variant="vault"
            size="lg"
            className="h-[54px] rounded-2xl"
            disabled={!valid || busy}
            onPress={() => onPassword(email.trim())}
            accessibilityLabel={t("auth.continuePassword")}
          >
            <Text className={cn("font-heading text-white", ar ? body : undefined)}>
              {t("auth.continuePassword")}
            </Text>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-[54px] rounded-2xl"
            disabled={!valid || busy}
            onPress={() => void onCode()}
            accessibilityLabel={t("auth.emailMeCode")}
          >
            {busy ? (
              <ActivityIndicator />
            ) : (
              <Text className={ar ? body : undefined}>{t("auth.emailMeCode")}</Text>
            )}
          </Button>
        </View>
      </View>
    </View>
  )
}
