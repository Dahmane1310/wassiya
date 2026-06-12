import { useState } from "react"
import { ActivityIndicator, Alert, View } from "react-native"
import { useRouter } from "expo-router"
import { Mail } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"
import { GoldRule } from "@/components/brand/gold-rule"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ThemeSwitcher } from "@/components/brand/theme-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import { type OAuthProvider } from "@/lib/auth"
import { useAuthStore } from "@/stores/auth"

/** The unauthenticated entry hero: brand, promise, and the sign-in choices —
 *  Google/Apple (provider-direct browser flow) or our native email screens. */
export function Welcome() {
  const { t } = useTranslation()
  const router = useRouter()
  const { display, body, tracking, ar } = useBrandType()
  const signIn = useAuthStore((s) => s.signIn)
  const [busy, setBusy] = useState<OAuthProvider | null>(null)

  async function onSignIn(provider: OAuthProvider) {
    setBusy(provider)
    try {
      await signIn(provider)
    } catch (err) {
      Alert.alert(
        t("auth.signInFailed"),
        err instanceof Error ? err.message : String(err)
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Centered minimal, elevated: a serif/Tajawal hero over an atmospheric teal
          glow with a staggered entrance. Top-right switchers (mirror to the start
          corner under RTL); brand + promise centered; CTA at bottom. */}
      <View className="flex-1 pb-6">
        <View className="flex-row items-center justify-end gap-2 pt-1">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </View>

        <View className="flex-1 items-center justify-center gap-9">
          {/* Brand */}
          <Animated.View
            entering={FadeInDown.duration(700)}
            className="items-center gap-4"
          >
            <BrandMark size={72} />
            <GoldRule />
          </Animated.View>

          {/* Promise — a display headline welded to a short body subhead. */}
          <Animated.View
            entering={FadeInDown.delay(220).duration(700)}
            className="gap-3 self-stretch px-2"
          >
            <Text
              accessibilityRole="header"
              className={cn(
                "text-center text-3xl leading-snug text-foreground",
                display,
                tracking
              )}
              maxFontSizeMultiplier={1.3}
            >
              {t("welcome.headline")}
            </Text>
            <Text
              className={cn(
                "text-center text-base leading-relaxed text-muted-foreground",
                body
              )}
            >
              {t("welcome.subhead")}
            </Text>
          </Animated.View>
        </View>

        {/* Sign-in choices: Google/Apple open the provider directly in the
            browser (PKCE, no hosted interstitial); email uses our native
            screens via the backend proxy. All handle new AND returning users. */}
        <Animated.View
          entering={FadeInUp.delay(440).duration(700)}
          className="gap-5"
        >
          <View className="gap-2">
            <Button
              variant="vault"
              size="lg"
              className="h-[54px] rounded-2xl"
              onPress={() => void onSignIn("GoogleOAuth")}
              disabled={busy !== null}
              accessibilityLabel={t("welcome.continueGoogle")}
            >
              {busy === "GoogleOAuth" ? (
                <ActivityIndicator color="white" />
              ) : (
                /* In English keep the button's medium weight; in Arabic route
                   through Tajawal so the glyphs aren't tofu on Android. */
                <Text className={cn("font-heading text-white", ar ? body : undefined)}>
                  {t("welcome.continueGoogle")}
                </Text>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-[54px] rounded-2xl"
              onPress={() => void onSignIn("AppleOAuth")}
              disabled={busy !== null}
              accessibilityLabel={t("welcome.continueApple")}
            >
              {busy === "AppleOAuth" ? (
                <ActivityIndicator />
              ) : (
                <Text className={ar ? body : undefined}>{t("welcome.continueApple")}</Text>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-[54px] rounded-2xl"
              onPress={() => router.push("/auth")}
              disabled={busy !== null}
              accessibilityLabel={t("welcome.continueEmail")}
            >
              <Icon as={Mail} className="text-foreground" />
              <Text className={ar ? body : undefined}>{t("welcome.continueEmail")}</Text>
            </Button>
          </View>

          <Text variant="muted" className={cn("px-4 text-center", body)}>
            {t("welcome.footer")}
          </Text>
        </Animated.View>
      </View>
    </ScreenContainer>
  )
}
