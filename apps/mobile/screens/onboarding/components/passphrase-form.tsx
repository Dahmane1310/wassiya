import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { AlertTriangle } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { PassphraseField } from "@/components/ui/passphrase-field"
import { useBrandType } from "@/hooks/use-brand-type"
import { PasswordStrength } from "@/screens/onboarding/components/password-strength"

const MIN_LENGTH = 12

export function PassphraseForm({
  onSubmit,
}: {
  onSubmit: (passphrase: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
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

  const labelClass = cn("font-sans-semibold text-[12.5px] text-ink-2", body)
  const errorClass = cn("text-xs text-danger", body)

  return (
    <View className="gap-4 self-stretch">
      <View className="gap-2">
        <Text className={labelClass}>{t("onboarding.passphraseLabel")}</Text>
        <PassphraseField
          value={passphrase}
          onChangeText={setPassphrase}
          placeholder={t("onboarding.passphrasePlaceholder")}
          accessibilityLabel={t("onboarding.passphraseLabel")}
          newPassword
        />
        <PasswordStrength value={passphrase} />
        {tooShort ? (
          <Text className={errorClass}>
            {t("onboarding.tooShort", { min: MIN_LENGTH })}
          </Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className={labelClass}>{t("onboarding.confirmLabel")}</Text>
        <PassphraseField
          value={confirm}
          onChangeText={setConfirm}
          placeholder={t("onboarding.confirmPlaceholder")}
          accessibilityLabel={t("onboarding.confirmLabel")}
          newPassword
        />
        {mismatch ? <Text className={errorClass}>{t("onboarding.mismatch")}</Text> : null}
      </View>

      {/* Recovery-kit warning — the design's amber caution that this is unrecoverable. */}
      <View className="flex-row items-center gap-2.5 rounded-2xl bg-gold-soft p-3.5">
        <Icon as={AlertTriangle} size={18} className="text-gold-deep" />
        <Text className={cn("flex-1 text-[12.5px] leading-[1.4] text-gold-deep", body)}>
          {t("onboarding.recoveryWarning")}
        </Text>
      </View>

      {error ? <Text className={cn("text-sm text-danger", body)}>{error}</Text> : null}

      <Button
        variant="vault"
        size="lg"
        className="h-[54px] rounded-2xl"
        onPress={() => void submit()}
        disabled={!canSubmit || busy}
        accessibilityLabel={t("onboarding.cta")}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={cn("font-heading text-white", body)}>{t("onboarding.cta")}</Text>
        )}
      </Button>
    </View>
  )
}
