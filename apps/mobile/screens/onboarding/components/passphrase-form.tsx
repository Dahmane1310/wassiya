import { useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"
import { Eye, EyeOff } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Input } from "@workspace/ui-native/components/ui/input"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { PasswordStrength } from "@/screens/onboarding/components/password-strength"

const MIN_LENGTH = 12

export function PassphraseForm({
  onSubmit,
}: {
  onSubmit: (passphrase: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooShort = passphrase.length > 0 && passphrase.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && confirm !== passphrase
  const canSubmit = passphrase.length >= MIN_LENGTH && passphrase === confirm

  async function submit() {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      // PBKDF2 (210k) runs here, on submit — never per keystroke. On success the
      // hook holds the key and navigates away (this component unmounts).
      await onSubmit(passphrase)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const labelClass = cn("text-sm text-foreground", body)
  const errorClass = cn("text-xs text-destructive", body)

  return (
    <View className="gap-4 self-stretch">
      <View className="gap-2">
        <Text className={labelClass}>{t("onboarding.passphraseLabel")}</Text>
        <View className="relative">
          <Input
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            placeholder={t("onboarding.passphrasePlaceholder")}
            className="pr-10"
          />
          <Pressable
            onPress={() => setShow((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t(show ? "onboarding.hide" : "onboarding.show")}
            className="absolute top-0 right-0 h-10 w-10 items-center justify-center"
          >
            <Icon
              as={show ? EyeOff : Eye}
              className="text-muted-foreground"
              size={18}
            />
          </Pressable>
        </View>
        <PasswordStrength value={passphrase} />
        {tooShort ? (
          <Text className={errorClass}>
            {t("onboarding.tooShort", { min: MIN_LENGTH })}
          </Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className={labelClass}>{t("onboarding.confirmLabel")}</Text>
        <Input
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          placeholder={t("onboarding.confirmPlaceholder")}
        />
        {mismatch ? (
          <Text className={errorClass}>{t("onboarding.mismatch")}</Text>
        ) : null}
      </View>

      {error ? (
        <Text className={cn("text-sm text-destructive", body)}>{error}</Text>
      ) : null}

      <Button
        size="lg"
        onPress={() => void submit()}
        disabled={!canSubmit || busy}
        accessibilityLabel={t("onboarding.cta")}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={ar ? body : undefined}>{t("onboarding.cta")}</Text>
        )}
      </Button>
    </View>
  )
}
