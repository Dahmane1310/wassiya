import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { useBrandType } from "@/hooks/use-brand-type"

/** Dashboard header: brand mark + a "welcome back" eyebrow over the wordmark,
 *  with the language switcher top-right (mirrors to the start under RTL). */
export function HomeHeader() {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()

  return (
    <View className="gap-5 pt-1">
      <View className="flex-row items-center justify-between">
        <BrandMark size={40} />
        <LanguageSwitcher />
      </View>
      <View className="gap-1">
        <Text className={cn("text-sm text-muted-foreground", body)}>
          {t("home.welcomeBack")}
        </Text>
        <Text
          accessibilityRole="header"
          className={cn("text-3xl text-foreground", display, tracking)}
          maxFontSizeMultiplier={1.3}
        >
          {t("brand.name")}
        </Text>
      </View>
    </View>
  )
}
