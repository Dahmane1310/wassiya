import { useState } from "react"
import { View } from "react-native"
import { useRouter } from "expo-router"
import { Key } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { BiometricEnrollPrompt } from "@/components/vault/biometric-enroll-prompt"
import { useBrandType } from "@/hooks/use-brand-type"
import { useSwitch } from "@/hooks/use-switch"
import { useVault } from "@/hooks/use-vault"
import { isBiometricAvailable } from "@/lib/biometric"
import { ArmedStep } from "@/screens/onboarding/components/armed-step"
import { CadenceStep } from "@/screens/onboarding/components/cadence-step"
import { PassphraseForm } from "@/screens/onboarding/components/passphrase-form"
import { usePreferences } from "@/stores/preferences"

type Step = "passphrase" | "cadence" | "armed"

/** Two-Step onboarding: create the local Vault Passphrase, (optionally enroll
 *  biometric unlock), set the heartbeat cadence, then arm the vault. The screen
 *  owns navigation; the hook holds the key. Cadence is front-end only for now. */
export function OnboardingScreen() {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  const router = useRouter()
  const { setupVault } = useVault()
  const { arm } = useSwitch()
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const [step, setStep] = useState<Step>("passphrase")
  const [pendingPassphrase, setPendingPassphrase] = useState<string | null>(null)
  const [cadence, setCadence] = useState(30)

  const DAY_MS = 24 * 60 * 60 * 1000
  // Arm the switch with the chosen cadence. Non-fatal: a network blip mustn't
  // strand onboarding — the first check-in lazily arms with defaults anyway.
  function armAndContinue() {
    void arm(cadence * DAY_MS, 14 * DAY_MS).catch(() => {})
    setStep("armed")
  }

  async function handleCreate(passphrase: string) {
    const result = await setupVault(passphrase)
    if (result === "exists") {
      // A vault already exists with a different salt (reinstall / 2nd device).
      router.replace("/unlock")
      return
    }
    if (isBiometricAvailable() && !biometricEnabled) {
      setPendingPassphrase(passphrase) // → biometric enroll, then cadence
      return
    }
    setStep("cadence")
  }

  return (
    <ScreenContainer scroll>
      <View className="min-h-[88%] flex-1 gap-8 pb-6">
        <View className="flex-row justify-end pt-1">
          <LanguageSwitcher />
        </View>

        {pendingPassphrase !== null ? (
          <BiometricEnrollPrompt
            passphrase={pendingPassphrase}
            onDone={() => {
              setPendingPassphrase(null)
              setStep("cadence")
            }}
          />
        ) : step === "cadence" ? (
          <CadenceStep value={cadence} onChange={setCadence} onArm={armAndContinue} />
        ) : step === "armed" ? (
          <ArmedStep onEnter={() => router.replace("/home")} />
        ) : (
          <>
            <View className="gap-4 pt-1">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
                <Icon as={Key} size={30} className="text-primary" />
              </View>
              <View className="gap-2">
                <Text
                  accessibilityRole="header"
                  className={cn("text-[28px] leading-[1.1] text-foreground", display, tracking)}
                  maxFontSizeMultiplier={1.3}
                >
                  {t("onboarding.headline")}
                </Text>
                <Text className={cn("text-[14.5px] leading-relaxed text-ink-2", body)}>
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
