import { Pressable, View } from "react-native"
import { ChevronRight, Crown } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useEntitlement } from "@/hooks/use-entitlement"
import { useThemeColors } from "@/lib/colors"
import { usePaywallStore } from "@/stores/paywall"

/**
 * Trial countdown / expired nudge on the Vault home. Renders ONLY while trialing or
 * expired (paid users see nothing); tapping it opens the paywall. Gold accent while
 * counting down, red once the trial has ended.
 */
export function TrialBanner() {
  const { t } = useTranslation()
  const { display, body } = useBrandType()
  const c = useThemeColors()
  const show = usePaywallStore((s) => s.show)
  const ent = useEntitlement()

  if (!ent.isTrialing && !ent.isExpired) {
    return null
  }

  const expired = ent.isExpired
  const title = expired ? t("paywall.trialEnded") : t("paywall.daysLeft", { days: ent.trialDaysLeft })

  return (
    <Pressable
      onPress={show}
      className={cn(
        "flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80",
        expired ? "border-red-soft bg-red-soft" : "border-gold-soft bg-gold-soft"
      )}
    >
      <Crown size={18} color={expired ? c.red : c.goldDeep} strokeWidth={2} />
      <View className="flex-1">
        <Text className={cn("text-[14.5px]", expired ? "text-danger" : "text-gold-deep", display)}>
          {title}
        </Text>
        <Text className={cn("text-[12.5px] text-ink-3", body)}>{t("paywall.upgradeCta")}</Text>
      </View>
      <Icon as={ChevronRight} size={18} className={expired ? "text-danger" : "text-gold-deep"} />
    </Pressable>
  )
}
