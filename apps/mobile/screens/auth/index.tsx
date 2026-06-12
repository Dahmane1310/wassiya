import { useState } from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { BrandMark } from "@/components/brand/brand-mark"
import { GoldRule } from "@/components/brand/gold-rule"
import { LanguageSwitcher } from "@/components/brand/language-switcher"
import { ThemeSwitcher } from "@/components/brand/theme-switcher"
import { ScreenContainer } from "@/components/layout/screen-container"
import { type WorkOSTokens } from "@/lib/auth"
import { useAuthStore } from "@/stores/auth"
import { CodeStep } from "./components/code-step"
import { EmailStep } from "./components/email-step"
import { PasswordStep } from "./components/password-step"

type Step =
  | { kind: "email" }
  | { kind: "password"; email: string }
  | { kind: "magic"; email: string }
  | { kind: "verify"; pendingToken: string; email: string }

/**
 * Native email sign-in (our UI; WorkOS underneath via the Convex proxy):
 * email → password or one-time code → (maybe) email verification → tokens.
 * Google/Apple stay on the Welcome screen (browser PKCE, provider-direct).
 *
 * Mirrors the Welcome composition: switchers top-right, centered brand mark +
 * gold rule, then the step content fading in — re-animated on each step change.
 */
export function AuthScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const signInWithTokens = useAuthStore((s) => s.signInWithTokens)
  const [step, setStep] = useState<Step>({ kind: "email" })

  async function onTokens(tokens: WorkOSTokens) {
    await signInWithTokens(tokens)
    // Back to the root gate (VaultGate routes to onboarding/unlock/recovery).
    router.replace("/")
  }

  const toEmail = () => setStep({ kind: "email" })

  return (
    <ScreenContainer scroll>
      <View className="min-h-[92%] flex-1 pb-6">
        <View className="flex-row items-center justify-between pt-1">
          <Pressable
            onPress={step.kind === "email" ? () => router.back() : toEmail}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            className="-ml-1 flex-row items-center gap-1 active:opacity-70"
          >
            <Icon as={ChevronLeft} size={18} className="text-primary" />
            <Text className="font-sans-semibold text-[15px] text-primary">
              {t("common.back")}
            </Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(650)}
          className="items-center gap-4 pb-2 pt-10"
        >
          <BrandMark size={64} />
          <GoldRule />
        </Animated.View>

        {/* Keyed on the step so each transition gets its own entrance. */}
        <Animated.View
          key={step.kind}
          entering={FadeInDown.delay(120).duration(500)}
          className="flex-1 pt-7"
        >
          {step.kind === "email" && (
            <EmailStep
              onPassword={(email) => setStep({ kind: "password", email })}
              onMagicSent={(email) => setStep({ kind: "magic", email })}
            />
          )}
          {step.kind === "password" && (
            <PasswordStep
              email={step.email}
              onTokens={onTokens}
              onVerify={(pendingToken) =>
                setStep({ kind: "verify", pendingToken, email: step.email })
              }
              onEditEmail={toEmail}
            />
          )}
          {(step.kind === "magic" || step.kind === "verify") && (
            <CodeStep
              variant={step.kind}
              email={step.email}
              pendingToken={step.kind === "verify" ? step.pendingToken : undefined}
              onTokens={onTokens}
            />
          )}
        </Animated.View>
      </View>
    </ScreenContainer>
  )
}
