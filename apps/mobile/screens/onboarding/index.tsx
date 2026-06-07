import { useState } from "react"
import { View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { RecoveryKeyCard } from "@/components/ui/recovery-key-card"
import { BiometricEnrollPrompt } from "@/components/vault/biometric-enroll-prompt"
import { useBrandType } from "@/hooks/use-brand-type"
import { useSwitch } from "@/hooks/use-switch"
import { useVault } from "@/hooks/use-vault"
import { isBiometricAvailable } from "@/lib/biometric"
import { useAccountId } from "@/stores/auth"
import { useBiometricEnabled } from "@/stores/preferences"
import { ArmedStep } from "@/screens/onboarding/components/armed-step"
import { CadenceStep } from "@/screens/onboarding/components/cadence-step"
import { PinForm } from "@/screens/onboarding/components/pin-form"

type Step = "pin" | "recovery" | "enroll" | "cadence" | "armed"

/** Onboarding: create a 6-digit Vault PIN, save the one-time Recovery Key,
 *  (optionally enroll biometric unlock), set the heartbeat cadence, then arm the
 *  vault. The screen owns navigation; the hook holds the master key. */
export function OnboardingScreen() {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  const router = useRouter()
  const { setupVault } = useVault()
  const { arm } = useSwitch()
  const accountId = useAccountId()
  const biometricEnabled = useBiometricEnabled(accountId)
  const [step, setStep] = useState<Step>("pin")
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [mkBytes, setMkBytes] = useState<Uint8Array<ArrayBuffer> | null>(null)
  const [cadence, setCadence] = useState(30)

  const DAY_MS = 24 * 60 * 60 * 1000

  async function handleCreate(pin: string) {
    const result = await setupVault(pin)
    if (result.status === "exists") {
      // A vault already exists on the server (reinstall / 2nd device) — recover it.
      router.replace("/recovery")
      return
    }
    setRecoveryCode(result.recoveryCode)
    setMkBytes(result.mkBytes)
    setStep("recovery")
  }

  // Past the recovery key: enroll biometric if available, else go to cadence.
  function afterRecovery() {
    if (isBiometricAvailable() && !biometricEnabled) {
      setStep("enroll")
      return
    }
    finishKeyHandling()
    setStep("cadence")
  }

  // Zero the raw master-key bytes once we no longer need them for enrolment.
  function finishKeyHandling() {
    mkBytes?.fill(0)
    setMkBytes(null)
  }

  // Arm the switch with the chosen cadence. Non-fatal: a network blip mustn't
  // strand onboarding — the first check-in lazily arms with defaults anyway.
  function armAndContinue() {
    void arm(cadence * DAY_MS, 14 * DAY_MS).catch(() => {})
    setStep("armed")
  }

  return (
    <ScreenContainer scroll>
      <View className="min-h-[88%] flex-1 gap-8 pb-6">
        <View className="flex-row justify-end pt-1">
          <LanguageSwitcher />
        </View>

        {step === "recovery" && recoveryCode ? (
          <RecoveryKeyCard code={recoveryCode} onContinue={afterRecovery} />
        ) : step === "enroll" && mkBytes ? (
          <BiometricEnrollPrompt
            mkBytes={mkBytes}
            onDone={() => {
              finishKeyHandling()
              setStep("cadence")
            }}
          />
        ) : step === "cadence" ? (
          <CadenceStep value={cadence} onChange={setCadence} onArm={armAndContinue} />
        ) : step === "armed" ? (
          <ArmedStep onEnter={() => router.replace("/home")} />
        ) : (
          <>
            <View className="gap-2 pt-1">
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

            <PinForm onSubmit={handleCreate} />
          </>
        )}
      </View>
    </ScreenContainer>
  )
}
