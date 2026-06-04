import { Languages, Palette } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Separator } from "@workspace/ui-native/components/ui/separator"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ThemeSwitcher } from "@/components/brand/theme-switcher"
import { SettingsRow } from "@/screens/settings/components/settings-row"
import { SettingsSection } from "@/screens/settings/components/settings-section"

/** Appearance: theme + language, each driven by its existing switcher control. */
export function AppearanceSection() {
  const { t } = useTranslation()

  return (
    <SettingsSection title={t("settings.appearance")}>
      <SettingsRow
        icon={Palette}
        label={t("settings.theme")}
        right={<ThemeSwitcher />}
      />
      <Separator />
      <SettingsRow
        icon={Languages}
        label={t("settings.language")}
        right={<LanguageSwitcher />}
      />
    </SettingsSection>
  )
}
