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
import { WrongPassphraseError } from "@/lib/vault"

export function UnlockForm({
  onUnlock,
}: {
  onUnlock: (passphrase: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const [passphrase, setPassphrase] = useState("")
  const [show, setShow] = useState(false)
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
        <Text className={cn("text-sm text-foreground", body)}>
          {t("unlock.passphraseLabel")}
        </Text>
        <View className="relative">
          <Input
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholder={t("unlock.passphrasePlaceholder")}
            onSubmitEditing={() => void submit()}
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
        {error ? (
          <Text className={cn("text-sm text-destructive", body)}>{error}</Text>
        ) : null}
      </View>

      <Button
        size="lg"
        onPress={() => void submit()}
        disabled={passphrase.length === 0 || busy}
        accessibilityLabel={t("unlock.cta")}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={ar ? body : undefined}>{t("unlock.cta")}</Text>
        )}
      </Button>
    </View>
  )
}
