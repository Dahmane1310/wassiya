import { View } from "react-native"
import { useRouter } from "expo-router"
import {
  BadgeCheck,
  Crown,
  Fingerprint,
  HelpCircle,
  Key,
  Lock,
  RefreshCw,
  ScrollText,
  Sparkles,
  Users,
  X,
} from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ScreenContainer } from "@/components/layout/screen-container"
import { Pill } from "@/components/ui/pill"
import { ScreenHeader } from "@/components/ui/screen-header"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { useThemeColors } from "@/lib/colors"
import { isBiometricAvailable } from "@/lib/biometric"
import { useVault } from "@/hooks/use-vault"
import { AppearanceControl } from "@/screens/settings/components/appearance-control"
import { IdentityCard } from "@/screens/settings/components/identity-card"
import { OwnerGenderControl } from "@/screens/settings/components/owner-gender-control"
import { ProfileGroup } from "@/screens/settings/components/profile-group"
import { ProfileRow } from "@/screens/settings/components/profile-row"
import { SwitchSection } from "@/screens/settings/components/switch-section"
import { useAuthStore } from "@/stores/auth"
import { usePreferences } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

/** Profile — identity, the dead-man's switch, security, appearance and account.
 *  Switch/executors/plan are mock; theme, language, lock, biometric and sign-out
 *  are wired to the real stores. */
export function SettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useThemeColors()
  const { lock, disableBiometric } = useVault()
  const unlocked = useVaultStore((s) => s.status === "unlocked")
  const biometricEnabled = usePreferences((s) => s.biometricEnabled)
  const biometricAvailable = isBiometricAvailable()
  const signOut = useAuthStore((s) => s.signOut)

  async function handleSignOut() {
    await signOut()
    router.replace("/")
  }

  return (
    <ScreenContainer scroll edges={["top"]}>
      <View className="flex-1 gap-5 pb-28 pt-1">
        <ScreenHeader title={t("profile.title")} />
        <IdentityCard />
        <SwitchSection />

        <ProfileGroup title={t("profile.security")}>
          <ProfileRow
            icon={Key}
            color={c.primary}
            title={t("profile.passphrase")}
            badge={<Pill tone="green">{t("profile.strong")}</Pill>}
            onPress={() => {}}
          />
          {biometricAvailable && biometricEnabled ? (
            <ProfileRow
              icon={Fingerprint}
              color={c.green}
              title={t("profile.biometricOff")}
              onPress={() => void disableBiometric()}
            />
          ) : (
            <ProfileRow
              icon={Fingerprint}
              color={c.green}
              title={t("profile.biometric")}
              detail={biometricAvailable ? t("profile.biometricHint") : t("profile.biometricUnavailable")}
            />
          )}
          <ProfileRow
            icon={Lock}
            color={c.goldDeep}
            title={t("profile.encryption")}
            detail="AES-256-GCM"
            onPress={() => {}}
          />
          {unlocked ? (
            <ProfileRow icon={RefreshCw} color={c.primary} title={t("profile.lockNow")} onPress={() => lock()} last />
          ) : (
            <ProfileRow icon={RefreshCw} color={c.ink3} title={t("profile.locked")} last />
          )}
        </ProfileGroup>

        <ProfileGroup title={t("profile.appearance")}>
          <AppearanceControl />
          <View className="border-t border-line-2" />
          <View className="flex-row items-center justify-between px-3.5 py-3">
            <Text className="font-sans-semibold text-[15px] text-foreground">
              {t("profile.language")}
            </Text>
            <LanguageSwitcher />
          </View>
        </ProfileGroup>

        <ProfileGroup title={t("profile.inheritance")}>
          <OwnerGenderControl />
        </ProfileGroup>

        <ProfileGroup title={t("profile.release")}>
          <ProfileRow
            icon={Users}
            color={c.primary}
            title={t("profile.contacts")}
            onPress={() => router.push("/contacts")}
            last
          />
        </ProfileGroup>

        <ProfileGroup title={t("profile.general")}>
          <ProfileRow icon={Crown} color={c.goldDeep} title={t("profile.plan")} detail={t("profile.lifetime")} onPress={() => {}} />
          <ProfileRow
            icon={ScrollText}
            color={c.primary}
            title={t("profile.legal")}
            badge={<Pill tone="green">{t("profile.verified")}</Pill>}
            onPress={() => {}}
          />
          <ProfileRow icon={Sparkles} color={c.gold} title={t("profile.replayOnboarding")} onPress={() => router.replace("/onboarding")} />
          <ProfileRow icon={HelpCircle} color={c.ink2} title={t("profile.help")} onPress={() => {}} last />
        </ProfileGroup>

        <ProfileGroup>
          <ProfileRow icon={X} color={c.red} title={t("profile.signOut")} danger onPress={() => void handleSignOut()} last />
        </ProfileGroup>

        <Text className="text-center font-sans-medium text-[11.5px] text-ink-3">
          {t("profile.footer")}
        </Text>
      </View>
    </ScreenContainer>
  )
}
