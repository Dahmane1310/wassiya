import { useTranslation } from "react-i18next"
import { OptionSheet } from "@/components/ui/option-sheet"
import { setThemeMode, useThemeMode, type ThemeMode } from "@/lib/theme"

const MODES: ThemeMode[] = ["light", "dark", "system"]

/** Theme picker — Light / Dark / System, wired to the reactive theme store.
 *  Switching is instant (no reload); the sheet closes on select. */
export function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const mode = useThemeMode((s) => s.mode)

  return (
    <OptionSheet
      open={open}
      onClose={onClose}
      title={t("profile.theme")}
      subtitle={t("profile.themeSubtitle")}
      selectedKey={mode}
      options={MODES.map((m) => ({ key: m, label: t(`profile.${m}`) }))}
      onSelect={(key) => {
        void setThemeMode(key as ThemeMode)
        onClose()
      }}
    />
  )
}
