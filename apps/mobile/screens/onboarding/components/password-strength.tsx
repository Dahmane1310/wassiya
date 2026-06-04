import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

// Pure local heuristic — length + character variety. MUST NEVER call
// deriveKeyFromPassword (210k PBKDF2 per keystroke would freeze Hermes).
function scorePassphrase(value: string): number {
  let score = 0
  if (value.length >= 12) score++
  if (value.length >= 16) score++
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(value)
  ).length
  if (classes >= 2) score++
  if (classes >= 3 || value.length >= 20) score++
  return Math.min(score, 4)
}

// Literal class strings (Tailwind scans these; a dynamic `bg-${x}` would purge).
const STRENGTH_COLOR = [
  "bg-border",
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-success",
] as const

export function PasswordStrength({ value }: { value: string }) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  if (!value) return null
  const score = scorePassphrase(value)
  const labels = [
    "",
    t("onboarding.strength.weak"),
    t("onboarding.strength.fair"),
    t("onboarding.strength.good"),
    t("onboarding.strength.strong"),
  ]
  return (
    <View className="gap-1.5">
      <View className="flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < score ? STRENGTH_COLOR[score] : "bg-border"
            )}
          />
        ))}
      </View>
      <Text className={cn("text-xs text-muted-foreground", body)}>
        {labels[score]}
      </Text>
    </View>
  )
}
