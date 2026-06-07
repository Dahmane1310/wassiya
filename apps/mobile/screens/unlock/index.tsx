import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { BiometricEnrollPrompt } from "@/components/vault/biometric-enroll-prompt"
import { useBrandType } from "@/hooks/use-brand-type"
import { useVault } from "@/hooks/use-vault"
import { isBiometricAvailable } from "@/lib/biometric"
import { hasPinWrap } from "@/lib/pin-store"
import { useAccountId, useAuthStore } from "@/stores/auth"
import { useBiometricEnabled } from "@/stores/preferences"
import { PinUnlockForm } from "@/screens/unlock/components/pin-unlock-form"

/** Returning-user unlock on THIS device: PIN (or biometric) → in-memory master key.
 *  Fully local — no server round-trip. Routes to recovery if this device has no PIN
 *  wrap (new device / reinstall). The screen owns navigation. */
export function UnlockScreen() {
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const router = useRouter()
  const { unlock, unlockWithBiometric } = useVault()
  const signOut = useAuthStore((s) => s.signOut)
  const accountId = useAccountId()
  const biometricEnabled = useBiometricEnabled(accountId)
  const [localPin, setLocalPin] = useState<boolean | null>(null)
  const [pendingMk, setPendingMk] = useState<Uint8Array<ArrayBuffer> | null>(null)
  const bioTried = useRef(false)

  const showBiometric = biometricEnabled && isBiometricAvailable()

  // Is there a PIN wrap for this account on this device? (null = still checking.)
  useEffect(() => {
    if (!accountId) return
    let active = true
    void hasPinWrap(accountId).then((has) => {
      if (active) setLocalPin(has)
    })
    return () => {
      active = false
    }
  }, [accountId])

  // One-touch return: auto-fire biometrics once on mount when enrolled.
  useEffect(() => {
    if (!showBiometric || bioTried.current || localPin !== true) return
    bioTried.current = true
    void attemptBiometric()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBiometric, localPin])

  async function attemptBiometric() {
    try {
      const ok = await unlockWithBiometric()
      if (ok) router.replace("/home")
    } catch {
      // Leave the PIN pad as the always-available fallback.
    }
  }

  async function handleUnlock(pin: string) {
    const { mkBytes } = await unlock(pin) // throws WrongPinError → form shows error
    // Offer biometric enrolment (master key in hand) before leaving.
    if (isBiometricAvailable() && !biometricEnabled) {
      setPendingMk(mkBytes)
      return
    }
    mkBytes.fill(0)
    router.replace("/home")
  }

  if (localPin === null) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-6">
          <BrandMark size={72} />
          <ActivityIndicator />
        </View>
      </ScreenContainer>
    )
  }
  // No PIN on this device → this is a new device; recover the vault instead.
  if (localPin === false) {
    return <Redirect href="/recovery" />
  }

  return (
    <ScreenContainer scroll>
      <View className="min-h-[90%] flex-1 gap-6 pb-6">
        <View className="flex-row justify-end pt-1">
          <LanguageSwitcher />
        </View>

        {pendingMk !== null ? (
          <BiometricEnrollPrompt
            mkBytes={pendingMk}
            onDone={() => {
              pendingMk.fill(0)
              router.replace("/home")
            }}
          />
        ) : (
          <>
            <View className="items-center gap-3 pt-2">
              <BrandMark size={56} />
              <Text className={cn("text-center text-[13.5px] text-ink-2", body)}>
                {t("unlock.subhead")}
              </Text>
            </View>

            <PinUnlockForm
              onUnlock={handleUnlock}
              showBiometric={showBiometric}
              onBiometric={() => void attemptBiometric()}
              onForgot={() => router.push("/recovery")}
            />

            <Button
              variant="link"
              onPress={() => void signOut()}
              accessibilityLabel={t("unlock.signOut")}
            >
              <Text className={ar ? body : undefined}>{t("unlock.signOut")}</Text>
            </Button>
          </>
        )}
      </View>
    </ScreenContainer>
  )
}
