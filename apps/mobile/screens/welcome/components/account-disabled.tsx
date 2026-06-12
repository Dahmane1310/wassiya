import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import { useAuthStore } from "@/stores/auth"

/** Calm full-screen state for a support-disabled account: nothing is lost — the
 *  vault data is kept — but every backend call is blocked until support re-enables. */
export function AccountDisabled() {
  const { t } = useTranslation()
  const { display, body, tracking, ar } = useBrandType()
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-7 pb-10">
        <BrandMark size={64} />
        <View className="gap-2.5 px-4">
          <Text
            accessibilityRole="header"
            className={cn("text-center text-2xl text-foreground", display, tracking)}
            maxFontSizeMultiplier={1.3}
          >
            {t("auth.disabledTitle")}
          </Text>
          <Text className={cn("text-center text-[14px] leading-relaxed text-ink-2", body)}>
            {t("auth.disabledBody")}
          </Text>
        </View>
        <Button
          variant="outline"
          size="lg"
          className="h-[54px] self-stretch rounded-2xl"
          onPress={() => void signOut()}
          accessibilityLabel={t("unlock.signOut")}
        >
          <Text className={ar ? body : undefined}>{t("unlock.signOut")}</Text>
        </Button>
      </View>
    </ScreenContainer>
  )
}
