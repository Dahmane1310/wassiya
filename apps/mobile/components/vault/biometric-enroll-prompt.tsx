import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { ScanFace } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useVault } from "@/hooks/use-vault"

/**
 * One-time offer to enable biometric unlock, shown right after a successful
 * passphrase entry (the only moment the plaintext passphrase is in hand). Reused
 * by the onboarding and unlock screens.
 */
export function BiometricEnrollPrompt({
  passphrase,
  onDone,
}: {
  passphrase: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { display, body, tracking, ar } = useBrandType()
  const { enableBiometric } = useVault()
  const [busy, setBusy] = useState(false)

  async function enable() {
    if (busy) return
    setBusy(true)
    try {
      await enableBiometric(passphrase)
    } catch {
      // Enrolling can fail (cancelled prompt / unavailable) — don't block the
      // user; they can enable it later. Proceed to the vault either way.
    } finally {
      onDone()
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-6">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon as={ScanFace} className="text-primary" size={36} />
      </View>
      <View className="items-center gap-3 px-2">
        <Text
          accessibilityRole="header"
          className={cn(
            "text-center text-2xl leading-snug text-foreground",
            display,
            tracking
          )}
          maxFontSizeMultiplier={1.3}
        >
          {t("biometric.enrollTitle")}
        </Text>
        <Text
          className={cn(
            "text-center text-base leading-relaxed text-muted-foreground",
            body
          )}
        >
          {t("biometric.enrollBody")}
        </Text>
      </View>
      <View className="gap-3 self-stretch">
        <Button
          size="lg"
          onPress={() => void enable()}
          disabled={busy}
          accessibilityLabel={t("biometric.enable")}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={ar ? body : undefined}>
              {t("biometric.enable")}
            </Text>
          )}
        </Button>
        <Button
          variant="link"
          onPress={onDone}
          disabled={busy}
          accessibilityLabel={t("biometric.notNow")}
        >
          <Text className={ar ? body : undefined}>{t("biometric.notNow")}</Text>
        </Button>
      </View>
    </View>
  )
}
