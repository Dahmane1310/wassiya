import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
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
import { BiometricUnlock } from "@/screens/unlock/components/biometric-unlock"
import { UnlockForm } from "@/screens/unlock/components/unlock-form"
import { useAuthStore } from "@/stores/auth"
import { usePreferences } from "@/stores/preferences"

/** Returning-user unlock: re-derive the in-memory master key via biometrics or
 *  the passphrase. The screen owns navigation (the hook holds the key only). */
export function UnlockScreen() {
  const { t } = useTranslation()
  const { display, body, tracking, ar } = useBrandType()
  const router = useRouter()
  const { unlock } = useVault()
  const status = useQuery(api.vault.getVaultStatus)
  const signOut = useAuthStore((s) => s.signOut)
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const [pendingPassphrase, setPendingPassphrase] = useState<string | null>(
    null
  )

  if (status === undefined) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-6">
          <BrandMark size={72} />
          <ActivityIndicator />
        </View>
      </ScreenContainer>
    )
  }

  // The gate only routes here when a vault exists; guard defensively anyway.
  if (!status.vaultSalt || !status.passphraseVerifier) {
    return <Redirect href="/onboarding" />
  }
  const { vaultSalt, passphraseVerifier } = status

  async function handleUnlock(passphrase: string) {
    // Throws WrongPassphraseError on a bad passphrase — the form catches it.
    await unlock(passphrase, vaultSalt, passphraseVerifier)
    if (isBiometricAvailable() && !biometricEnabled) {
      setPendingPassphrase(passphrase) // → biometric enroll step
      return
    }
    router.replace("/home")
  }

  const showBiometric = biometricEnabled && isBiometricAvailable()

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
                  {t("unlock.heading")}
                </Text>
                <Text
                  className={cn(
                    "text-center text-base leading-relaxed text-muted-foreground",
                    body
                  )}
                >
                  {t("unlock.subhead")}
                </Text>
              </View>
            </View>

            {showBiometric ? (
              <BiometricUnlock
                salt={vaultSalt}
                verifier={passphraseVerifier}
                onUnlocked={() => router.replace("/home")}
              />
            ) : null}

            <UnlockForm onUnlock={handleUnlock} />

            <Button
              variant="link"
              onPress={() => void signOut()}
              accessibilityLabel={t("unlock.signOut")}
            >
              <Text className={ar ? body : undefined}>
                {t("unlock.signOut")}
              </Text>
            </Button>
          </>
        )}
      </View>
    </ScreenContainer>
  )
}
