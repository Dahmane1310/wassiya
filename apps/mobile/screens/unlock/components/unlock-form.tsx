import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { PassphraseField } from "@/components/ui/passphrase-field"
import { useBrandType } from "@/hooks/use-brand-type"
import { WrongPassphraseError } from "@/lib/vault"

export function UnlockForm({
  onUnlock,
}: {
  onUnlock: (passphrase: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const [passphrase, setPassphrase] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (passphrase.length === 0 || busy) return
    setBusy(true)
    setError(null)
    try {
      // PBKDF2 (210k) runs here. On success the hook navigates away.
      await onUnlock(passphrase)
    } catch (err) {
      setError(
        err instanceof WrongPassphraseError
          ? t("unlock.wrongPassphrase")
          : err instanceof Error
            ? err.message
            : String(err)
      )
      setPassphrase("")
      setBusy(false)
    }
  }

  return (
    <View className="gap-4 self-stretch">
      <View className="gap-2">
        <Text className={cn("font-sans-semibold text-[12.5px] text-ink-2", body)}>
          {t("unlock.passphraseLabel")}
        </Text>
        <PassphraseField
          value={passphrase}
          onChangeText={setPassphrase}
          placeholder={t("unlock.passphrasePlaceholder")}
          accessibilityLabel={t("unlock.passphraseLabel")}
          onSubmitEditing={() => void submit()}
        />
        {error ? <Text className={cn("text-sm text-danger", body)}>{error}</Text> : null}
      </View>

      <Button
        variant="vault"
        size="lg"
        className="h-[54px] rounded-2xl"
        onPress={() => void submit()}
        disabled={passphrase.length === 0 || busy}
        accessibilityLabel={t("unlock.cta")}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={cn("font-heading text-white", body)}>{t("unlock.cta")}</Text>
        )}
      </Button>
    </View>
  )
}
