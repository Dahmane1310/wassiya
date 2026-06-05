import { useEffect, useRef } from "react"
import { View } from "react-native"
import { ScanFace } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type EncryptedDataPackage } from "@workspace/crypto"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useVault } from "@/hooks/use-vault"

/**
 * "Use biometrics" control on the unlock screen. Auto-fires once per mount (the
 * gate remounts /unlock on each lock, so a re-lock re-prompts; a cancel does not
 * — the user just uses the passphrase form below). A subtle "turn off" link is
 * the self-service recovery if the keystore was invalidated or it's unwanted.
 */
export function BiometricUnlock({
  salt,
  verifier,
  onUnlocked,
}: {
  salt: string
  verifier: EncryptedDataPackage
  onUnlocked: () => void
}) {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const { unlockWithBiometric, disableBiometric } = useVault()
  const attempted = useRef(false)

  async function attempt() {
    try {
      const ok = await unlockWithBiometric(salt, verifier)
      if (ok) onUnlocked()
    } catch {
      // An unexpected keystore/crypto error must not crash the screen — leave
      // the passphrase form (rendered below) as the always-available fallback.
    }
  }

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    void attempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View className="gap-1 self-stretch">
      <Button
        variant="vault"
        size="lg"
        className="h-[54px] rounded-2xl"
        onPress={() => void attempt()}
        accessibilityLabel={t("biometric.use")}
      >
        <Icon as={ScanFace} className="text-white" />
        <Text className={cn("font-heading text-white", ar ? body : undefined)}>
          {t("biometric.use")}
        </Text>
      </Button>
      <Button
        variant="link"
        onPress={() => void disableBiometric()}
        accessibilityLabel={t("biometric.turnOff")}
      >
        <Text className={cn("text-xs", body)}>{t("biometric.turnOff")}</Text>
      </Button>
    </View>
  )
}
