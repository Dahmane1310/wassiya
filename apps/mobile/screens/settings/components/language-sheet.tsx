import { useTranslation } from "react-i18next"
import { OptionSheet } from "@/components/ui/option-sheet"
import { setAppLanguage, type AppLanguage } from "@/lib/i18n"

/** Language picker — English / العربية. Each label renders in its own script's
 *  font (Arabic must use Tajawal even in EN, or it tofus on Android). Selecting a
 *  new language may reload the app when the layout direction flips (LTR ↔ RTL). */
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()

  return (
    <OptionSheet
      open={open}
      onClose={onClose}
      title={t("profile.language")}
      selectedKey={i18n.language === "ar" ? "ar" : "en"}
      options={[
        { key: "en", label: "English", labelClassName: "font-sans-semibold" },
        { key: "ar", label: "العربية", labelClassName: "font-body-ar" },
      ]}
      onSelect={(key) => {
        // setAppLanguage early-returns if unchanged, and reloads the app when the
        // direction flips — let the reload tear the sheet down on its own.
        onClose()
        void setAppLanguage(key as AppLanguage)
      }}
    />
  )
}
