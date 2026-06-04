import { Lock, ScanFace } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Separator } from "@workspace/ui-native/components/ui/separator"
import { useVault } from "@/hooks/use-vault"
import { isBiometricAvailable } from "@/lib/biometric"
import { SettingsRow } from "@/screens/settings/components/settings-row"
import { SettingsSection } from "@/screens/settings/components/settings-section"
import { usePreferences } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

/** Security: lock the vault now, and manage biometric unlock. The Lock row
 *  reflects state (it's disabled once locked — no /unlock route to bounce to in
 *  the lazy model; the Vault tab re-prompts on its own). Biometric can be turned
 *  OFF here, but turning it ON needs the plaintext passphrase (held only on
 *  unlock), so enabling happens on the Vault tab's unlock step. */
export function SecuritySection() {
  const { t } = useTranslation()
  const { lock, disableBiometric } = useVault()
  const unlocked = useVaultStore((s) => s.status === "unlocked")
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const available = isBiometricAvailable()

  return (
    <SettingsSection title={t("settings.security")}>
      {unlocked ? (
        <SettingsRow
          icon={Lock}
          label={t("settings.lock")}
          onPress={() => lock()}
        />
      ) : (
        <SettingsRow icon={Lock} label={t("settings.locked")} disabled />
      )}
      <Separator />
      {!available ? (
        <SettingsRow
          icon={ScanFace}
          label={t("settings.biometric")}
          description={t("settings.biometricUnavailable")}
          disabled
        />
      ) : biometricEnabled ? (
        <SettingsRow
          icon={ScanFace}
          label={t("settings.biometricOff")}
          onPress={() => void disableBiometric()}
        />
      ) : (
        <SettingsRow
          icon={ScanFace}
          label={t("settings.biometric")}
          description={t("settings.biometricEnableHint")}
          disabled
        />
      )}
    </SettingsSection>
  )
}
