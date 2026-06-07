import { Pressable, View } from "react-native"
import { Crown, ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { LinearGradient } from "expo-linear-gradient"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useEntitlement } from "@/hooks/use-entitlement"
import { useThemeColors } from "@/lib/colors"
import { usePaywallStore } from "@/stores/paywall"

/** Two-letter monogram from the user's name, falling back to the email. */
function initialsFrom(name: string, email: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (email ?? "··").slice(0, 2).toUpperCase()
}

/** Owner identity card — real WorkOS profile (name, email) over a soft bronze
 *  wash, with the plan + zero-knowledge badges. Falls back gracefully while the
 *  profile query is loading or before the WorkOS webhook has synced the name. */
export function IdentityCard() {
  const { t } = useTranslation()
  const { display } = useBrandType()
  const c = useThemeColors()
  const user = useQuery(api.users.currentUser)
  const ent = useEntitlement()
  const showPaywall = usePaywallStore((s) => s.show)

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  const email = user?.email ?? null
  const name = fullName || email || t("profile.you")
  const initials = initialsFrom(fullName, email)

  // Live plan label. Trial/expired users can tap it to open the paywall; paid users
  // see a static badge (nothing to upgrade).
  const planLabel = ent.isExpired
    ? t("paywall.planExpired")
    : ent.plan === "lifetime"
      ? t("paywall.planLifetime")
      : ent.plan === "annual"
        ? t("paywall.planAnnual")
        : t("paywall.planTrial", { days: ent.trialDaysLeft })
  // Tappable when there's something to upgrade — and always in dev, so the paywall's
  // simulate controls stay reachable even after a simulated lifetime purchase.
  const canUpgrade = ent.isTrialing || ent.isExpired || __DEV__

  return (
    <View className="overflow-hidden rounded-[28px] border border-border shadow-md shadow-black/5">
      <LinearGradient
        colors={[c.gold + "26", c.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center gap-3.5">
          <View
            className="h-[60px] w-[60px] items-center justify-center rounded-full border-2"
            style={{ backgroundColor: c.gold + "24", borderColor: c.gold }}
          >
            <Text className="font-heading text-[21px] text-gold-deep">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className={cn("text-[22px] text-foreground", display)}>
              {name}
            </Text>
            {email ? (
              <Text numberOfLines={1} className="font-sans-medium text-[13px] text-ink-3">
                {email}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="mt-4 flex-row gap-2">
          <Pressable
            disabled={!canUpgrade}
            onPress={showPaywall}
            className="h-[38px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-gold-soft active:opacity-70"
          >
            <Crown size={15} color={c.goldDeep} strokeWidth={2} />
            <Text className="font-heading text-[12.5px] text-gold-deep">{planLabel}</Text>
          </Pressable>
          <View className="h-[38px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-green-soft">
            <ShieldCheck size={15} color={c.green} strokeWidth={2} />
            <Text className="font-heading text-[12.5px] text-green">{t("profile.zeroKnowledge")}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}
