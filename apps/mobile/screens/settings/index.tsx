import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import { AccountSection } from "@/screens/settings/components/account-section"
import { AppearanceSection } from "@/screens/settings/components/appearance-section"
import { SecuritySection } from "@/screens/settings/components/security-section"

/** The Settings tab: appearance (theme/language), security (lock + biometric),
 *  and account (sign out). The bar owns the bottom inset, so inset only the top. */
export function SettingsScreen() {
  const { t } = useTranslation()
  const { display, tracking } = useBrandType()

  return (
    <ScreenContainer scroll edges={["top"]}>
      <View className="flex-1 gap-6 pt-2 pb-8">
        <Text
          accessibilityRole="header"
          className={cn("text-3xl text-foreground", display, tracking)}
          maxFontSizeMultiplier={1.3}
        >
          {t("settings.title")}
        </Text>
        <AppearanceSection />
        <SecuritySection />
        <AccountSection />
      </View>
    </ScreenContainer>
  )
}
