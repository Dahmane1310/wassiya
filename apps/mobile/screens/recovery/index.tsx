import { useState } from "react"
import { ActivityIndicator, TextInput, View } from "react-native"
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
import { useThemeColors } from "@/lib/colors"
import { WrongRecoveryKeyError } from "@/lib/vault"
import { useAccountId, useAuthStore } from "@/stores/auth"
import { useBiometricEnabled } from "@/stores/preferences"
import { PinForm } from "@/screens/onboarding/components/pin-form"

/** New-device / forgotten-PIN recovery: enter the Recovery Key to rebuild the master
 *  key from the server wrap, set a new local PIN, optionally enroll biometric, then
 *  open the vault. The Recovery Key is the only path back in — it is never on the
 *  server in usable form, only its high-entropy wrap. */
export function RecoveryScreen() {
  const { t } = useTranslation()
  const { display, body, tracking, ar } = useBrandType()
  const c = useThemeColors()
  const router = useRouter()
  const { recoverWithKey } = useVault()
  const status = useQuery(api.vault.getVaultStatus)
  const signOut = useAuthStore((s) => s.signOut)
  const accountId = useAccountId()
  const biometricEnabled = useBiometricEnabled(accountId)

  const [stage, setStage] = useState<"key" | "setPin" | "enroll">("key")
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)
  const [mkBytes, setMkBytes] = useState<Uint8Array<ArrayBuffer> | null>(null)

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
  // No server vault to recover → this account never onboarded.
  if (!status.recoveryWrappedKey || !status.recoverySalt) {
    return <Redirect href="/onboarding" />
  }
  const recovery = {
    recoverySalt: status.recoverySalt,
    recoveryWrappedKey: status.recoveryWrappedKey,
    recoveryWrapIv: status.recoveryWrapIv,
  }

  async function handleSetPin(newPin: string) {
    try {
      const { mkBytes: bytes } = await recoverWithKey(code, newPin, recovery)
      if (isBiometricAvailable() && !biometricEnabled) {
        setMkBytes(bytes)
        setStage("enroll")
        return
      }
      bytes.fill(0)
      router.replace("/home")
    } catch (err) {
      // Wrong Recovery Key — back to the key step. (PinForm rethrows so it resets.)
      if (err instanceof WrongRecoveryKeyError) {
        setError(true)
        setStage("key")
      }
      throw err
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="min-h-[90%] flex-1 gap-7 pb-6">
        <View className="flex-row justify-end pt-1">
          <LanguageSwitcher />
        </View>

        {stage === "enroll" && mkBytes ? (
          <BiometricEnrollPrompt
            mkBytes={mkBytes}
            onDone={() => {
              mkBytes.fill(0)
              router.replace("/home")
            }}
          />
        ) : stage === "setPin" ? (
          <View className="flex-1 gap-2">
            <Text className={cn("text-center text-[13.5px] text-ink-2", body)}>
              {t("recovery.setNewPin")}
            </Text>
            <PinForm onSubmit={handleSetPin} />
          </View>
        ) : (
          <>
            <View className="items-center gap-4 pt-2">
              <BrandMark size={56} />
              <View className="gap-2 px-2">
                <Text
                  accessibilityRole="header"
                  className={cn("text-center text-2xl text-foreground", display, tracking)}
                  maxFontSizeMultiplier={1.3}
                >
                  {t("recovery.title")}
                </Text>
                <Text className={cn("text-center text-[14px] leading-relaxed text-ink-2", body)}>
                  {t("recovery.body")}
                </Text>
              </View>
            </View>

            <View className="gap-2 self-stretch">
              <Text className={cn("font-sans-semibold text-[12.5px] text-ink-2", body)}>
                {t("recovery.enterKey")}
              </Text>
              <View className="rounded-2xl border border-border bg-card px-4 py-3">
                <TextInput
                  value={code}
                  onChangeText={(v) => {
                    setCode(v)
                    if (error) setError(false)
                  }}
                  placeholder="XXXXX-XXXXX-…"
                  placeholderTextColor={c.ink3}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  multiline
                  className="min-h-[48px] font-mono text-[16px] leading-[1.5] tracking-[1px] text-foreground"
                />
              </View>
              {error ? (
                <Text className={cn("text-[13px] text-danger", body)}>
                  {t("recovery.invalidKey")}
                </Text>
              ) : null}
            </View>

            <Button
              variant="vault"
              size="lg"
              className="h-[54px] rounded-2xl"
              disabled={code.trim().length === 0}
              onPress={() => setStage("setPin")}
              accessibilityLabel={t("recovery.cta")}
            >
              <Text className={cn("font-heading text-white", ar ? body : undefined)}>
                {t("recovery.cta")}
              </Text>
            </Button>

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
