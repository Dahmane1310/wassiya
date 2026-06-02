import { ActivityIndicator, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import { useAuthStore } from "@/stores/auth"

/** Placeholder shown once authenticated, until the real post-sign-in routing exists. */
export function PostSignInHandoff() {
  // TODO(post-sign-in routing): once the vault-home and passphrase-onboarding
  // screens exist, replace this placeholder with a redirect. Likely: read
  // getVaultSalt + the usePreferences `hasSeenWelcome` flag, then router.replace()
  // to passphrase-onboarding (no salt yet / first run) or vault-home (returning).
  // The hasSeenWelcome gate belongs to THAT routing decision, not this screen.
  const { t } = useTranslation()
  const { body, ar } = useBrandType()
  const signOut = useAuthStore((s) => s.signOut)
  return (
    <ScreenContainer>
      <View className="flex-row justify-end pt-1">
        <LanguageSwitcher />
      </View>
      <View className="flex-1 items-center justify-center gap-6">
        <BrandMark size={88} />
        <Text variant="lead" className={cn("text-center", body)}>
          {t("home.welcomeBack")}
        </Text>
        <ActivityIndicator />
        <Button variant="link" onPress={() => void signOut()}>
          <Text className={ar ? body : undefined}>{t("home.signOut")}</Text>
        </Button>
      </View>
    </ScreenContainer>
  )
}
