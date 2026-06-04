import { useState } from "react"
import { View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { BiometricEnrollPrompt } from "@/components/vault/biometric-enroll-prompt"
import { useBrandType } from "@/hooks/use-brand-type"
import { useVault } from "@/hooks/use-vault"
import { isBiometricAvailable } from "@/lib/biometric"
import { PassphraseForm } from "@/screens/onboarding/components/passphrase-form"
import { usePreferences } from "@/stores/preferences"

/** Two-Step onboarding: create the local Vault Passphrase, then optionally enroll
 *  biometric unlock. The screen owns navigation (the hook holds the key only). */
export function OnboardingScreen() {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  const router = useRouter()
  const { setupVault } = useVault()
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const [pendingPassphrase, setPendingPassphrase] = useState<string | null>(
    null
  )

  async function handleCreate(passphrase: string) {
    const result = await setupVault(passphrase)
    if (result === "exists") {
      // A vault already exists with a different salt (reinstall / 2nd device).
      router.replace("/unlock")
      return
    }
    if (isBiometricAvailable() && !biometricEnabled) {
      setPendingPassphrase(passphrase) // → biometric enroll step
      return
    }
    router.replace("/home")
  }

  return (
    <ScreenContainer scroll>
      <View className="flex-1 gap-8 pb-6">
        <View className="flex-row justify-end pt-1">
          <LanguageSwitcher />
        </View>

        {pendingPassphrase !== null ? (
          <BiometricEnrollPrompt
            passphrase={pendingPassphrase}
            onDone={() => router.replace("/home")}
          />
        ) : (
          <>
            <View className="items-center gap-5 pt-2">
              <BrandMark size={64} />
              <View className="gap-3 self-stretch px-2">
                <Text
                  accessibilityRole="header"
                  className={cn(
                    "text-center text-2xl leading-snug text-foreground",
                    display,
                    tracking
                  )}
                  maxFontSizeMultiplier={1.3}
                >
                  {t("onboarding.headline")}
                </Text>
                <Text
                  className={cn(
                    "text-center text-base leading-relaxed text-muted-foreground",
                    body
                  )}
                >
                  {t("onboarding.security")}
                </Text>
              </View>
            </View>

            <PassphraseForm onSubmit={handleCreate} />
          </>
        )}
      </View>
    </ScreenContainer>
  )
}
