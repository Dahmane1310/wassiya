import { useState } from "react"
import { Linking, View } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import {
  Activity,
  Clock,
  Fingerprint,
  HelpCircle,
  Key,
  Languages,
  LogOut,
  Palette,
  RefreshCw,
  Scale,
  Users,
} from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ScreenContainer } from "@/components/layout/screen-container"
import { ScreenHeader } from "@/components/ui/screen-header"
import { useThemeColors } from "@/lib/colors"
import { useThemeMode } from "@/lib/theme"
import { isBiometricAvailable } from "@/lib/biometric"
import { useSwitch } from "@/hooks/use-switch"
import { useVault } from "@/hooks/use-vault"
import { ChangePinSheet } from "@/screens/settings/components/change-pin-sheet"
import { GenderSheet } from "@/screens/settings/components/gender-sheet"
import { IdentityCard } from "@/screens/settings/components/identity-card"
import { LanguageSheet } from "@/screens/settings/components/language-sheet"
import { ProfileGroup } from "@/screens/settings/components/profile-group"
import { ProfileRow } from "@/screens/settings/components/profile-row"
import { SwitchConfigSheet } from "@/screens/settings/components/switch-config-sheet"
import { ThemeSheet } from "@/screens/settings/components/theme-sheet"
import { useAccountId, useAuthStore } from "@/stores/auth"
import { useBiometricEnabled } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

const SUPPORT_EMAIL = "support@wassiya.app"

type SheetKey = "cadence" | "grace" | "gender" | "theme" | "language" | "pin"

/** Profile — identity, the dead-man's switch, inheritance, recipients, security and
 *  preferences. Every preference opens a single-select bottom sheet; theme/language
 *  /gender/cadence/grace, lock, biometric, PIN and sign-out are wired to real
 *  stores and Convex. Informational rows (encryption, plan, legal) are non-tappable. */
export function SettingsScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const c = useThemeColors()
  const sw = useSwitch()
  const { lock, disableBiometric } = useVault()
  const unlocked = useVaultStore((s) => s.status === "unlocked")
  const user = useQuery(api.users.currentUser)
  const ownerGender = user?.ownerGender ?? null
  const themeMode = useThemeMode((s) => s.mode)
  const accountId = useAccountId()
  const biometricEnabled = useBiometricEnabled(accountId)
  const biometricAvailable = isBiometricAvailable()
  const signOut = useAuthStore((s) => s.signOut)
  const [sheet, setSheet] = useState<SheetKey | null>(null)

  const langLabel = i18n.language === "ar" ? "العربية" : "English"

  async function handleSignOut() {
    await signOut()
    router.replace("/")
  }

  return (
    <ScreenContainer scroll edges={["top"]}>
      <View className="flex-1 gap-5 pb-6 pt-1">
        <ScreenHeader title={t("profile.title")} />
        <IdentityCard />

        <ProfileGroup title={t("profile.switchTitle")}>
          <ProfileRow
            icon={Activity}
            color={c.green}
            title={t("profile.cadence")}
            detail={t("cadence.everyDays", { days: sw.cadenceDays })}
            onPress={() => setSheet("cadence")}
          />
          <ProfileRow
            icon={Clock}
            color={c.goldDeep}
            title={t("profile.grace")}
            detail={t("profile.daysValue", { days: sw.graceDays })}
            onPress={() => setSheet("grace")}
            last
          />
        </ProfileGroup>

        <ProfileGroup title={t("profile.inheritance")}>
          <ProfileRow
            icon={Scale}
            color={c.goldDeep}
            title={t("profile.ownerGender")}
            detail={ownerGender ? t(`gender.${ownerGender}`) : t("profile.genderNotSet")}
            onPress={() => setSheet("gender")}
            last
          />
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

        <ProfileGroup title={t("profile.security")}>
          <ProfileRow
            icon={Key}
            color={c.primary}
            title={t("profile.changePin")}
            onPress={() => setSheet("pin")}
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
          {unlocked ? (
            <ProfileRow icon={RefreshCw} color={c.primary} title={t("profile.lockNow")} onPress={() => lock()} last />
          ) : (
            <ProfileRow icon={RefreshCw} color={c.ink3} title={t("profile.locked")} last />
          )}
        </ProfileGroup>

        <ProfileGroup title={t("profile.preferences")}>
          <ProfileRow
            icon={Palette}
            color={c.primary}
            title={t("profile.theme")}
            detail={t(`profile.${themeMode}`)}
            onPress={() => setSheet("theme")}
          />
          <ProfileRow
            icon={Languages}
            color={c.green}
            title={t("profile.language")}
            detail={langLabel}
            onPress={() => setSheet("language")}
            last
          />
        </ProfileGroup>

        <ProfileGroup title={t("profile.general")}>
          <ProfileRow
            icon={HelpCircle}
            color={c.ink2}
            title={t("profile.help")}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
            last
          />
        </ProfileGroup>

        <ProfileGroup>
          <ProfileRow icon={LogOut} color={c.red} title={t("profile.signOut")} danger onPress={() => void handleSignOut()} last />
        </ProfileGroup>

        <Text className="text-center font-sans-medium text-[11.5px] text-ink-3">
          {t("profile.footer")}
        </Text>
      </View>

      <SwitchConfigSheet open={sheet === "cadence"} onClose={() => setSheet(null)} kind="cadence" />
      <SwitchConfigSheet open={sheet === "grace"} onClose={() => setSheet(null)} kind="grace" />
      <GenderSheet open={sheet === "gender"} onClose={() => setSheet(null)} value={ownerGender} />
      <ThemeSheet open={sheet === "theme"} onClose={() => setSheet(null)} />
      <LanguageSheet open={sheet === "language"} onClose={() => setSheet(null)} />
      <ChangePinSheet open={sheet === "pin"} onClose={() => setSheet(null)} />
    </ScreenContainer>
  )
}
