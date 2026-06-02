import { Pressable } from "react-native"
import { Languages } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { setAppLanguage } from "@/lib/i18n"

/**
 * A compact pill that toggles between English and Arabic. The label shows the
 * *target* language's name, so its font is chosen by the target's script (the
 * Arabic label must use Tajawal even while the app is still in English, or it
 * tofus on Android).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === "ar"
  const label = isArabic ? t("lang.toEnglish") : t("lang.toArabic")
  // Target is the opposite language; pick the font for its script.
  const labelFont = isArabic ? "font-sans" : "font-body-ar"

  return (
    <Pressable
      onPress={() => void setAppLanguage(isArabic ? "en" : "ar")}
      accessibilityRole="button"
      accessibilityLabel={
        isArabic ? "Switch to English" : "التبديل إلى العربية"
      }
      hitSlop={8}
      className={cn(
        "flex-row items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 active:opacity-70",
        className
      )}
    >
      <Icon as={Languages} className="text-muted-foreground" size={16} />
      <Text className={cn(labelFont, "text-sm text-foreground")}>{label}</Text>
    </Pressable>
  )
}
