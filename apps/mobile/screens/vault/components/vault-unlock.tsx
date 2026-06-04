import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useQuery } from "convex/react"
import { Lock } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BiometricEnrollPrompt } from "@/components/vault/biometric-enroll-prompt"
import { useBrandType } from "@/hooks/use-brand-type"
import { isBiometricAvailable } from "@/lib/biometric"
import { verifyPassphrase } from "@/lib/vault"
import { BiometricUnlock } from "@/screens/unlock/components/biometric-unlock"
import { UnlockForm } from "@/screens/unlock/components/unlock-form"
import { usePreferences } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

/**
 * In-tab unlock for the Vault tab (lazy-unlock model). Derives the master key on
 * demand via biometrics or the passphrase. Crucially, the verified key is held
 * LOCALLY while we offer biometric enrollment, and the vault store is only set
 * `unlocked` at the very end — otherwise committing the unlock would flip the
 * parent (VaultScreen) to content and unmount the enroll step before it shows.
 */
export function VaultUnlock() {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  const status = useQuery(api.vault.getVaultStatus)
  const setUnlocked = useVaultStore((s) => s.setUnlocked)
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const [pending, setPending] = useState<{
    key: CryptoKey
    passphrase: string
  } | null>(null)

  if (status === undefined) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator />
      </View>
    )
  }
  // Reachable only by onboarded users; nothing to unlock without a verifier.
  if (!status.vaultSalt || !status.passphraseVerifier) {
    return null
  }
  const { vaultSalt, passphraseVerifier } = status

  async function handleUnlock(passphrase: string) {
    // Throws WrongPassphraseError on a bad passphrase — UnlockForm catches it.
    const key = await verifyPassphrase(
      passphrase,
      vaultSalt,
      passphraseVerifier
    )
    if (isBiometricAvailable() && !biometricEnabled) {
      // Offer enrollment (passphrase in hand) BEFORE committing the unlock.
      setPending({ key, passphrase })
      return
    }
    setUnlocked(key)
  }

  if (pending !== null) {
    return (
      <BiometricEnrollPrompt
        passphrase={pending.passphrase}
        onDone={() => setUnlocked(pending.key)}
      />
    )
  }

  const showBiometric = biometricEnabled && isBiometricAvailable()

  return (
    <View className="flex-1 gap-8 pt-2">
      <View className="items-center gap-5">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon as={Lock} className="text-primary" size={30} />
        </View>
        <View className="gap-2 self-stretch px-2">
          <Text
            accessibilityRole="header"
            className={cn(
              "text-center text-2xl text-foreground",
              display,
              tracking
            )}
            maxFontSizeMultiplier={1.3}
          >
            {t("unlock.heading")}
          </Text>
          <Text
            className={cn("text-center text-base text-muted-foreground", body)}
          >
            {t("vault.unlockSubhead")}
          </Text>
        </View>
      </View>

      {showBiometric ? (
        <BiometricUnlock
          salt={vaultSalt}
          verifier={passphraseVerifier}
          onUnlocked={() => {}}
        />
      ) : null}

      <UnlockForm onUnlock={handleUnlock} />
    </View>
  )
}
