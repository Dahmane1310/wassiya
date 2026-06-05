import { View } from "react-native"
import { AlertTriangle, Check } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { LinearGradient } from "expo-linear-gradient"
import { useThemeColors } from "@/lib/colors"
import { pct } from "@/lib/mock-estate"
import { formatCurrencyAmount } from "@/lib/estate-summary"

/** Hero gauge: the total bequest % (sum of allocations) vs the ⅓ cap, the estate
 *  split bar, the real AED amount, and a within/at-cap status line. Editing is
 *  per-beneficiary (the cap is enforced there + server-side). */
export function BequestHero({
  total,
  cap,
  netAmount,
  currency,
}: {
  total: number
  cap: number
  netAmount: number
  currency: string
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const atCap = total >= cap - 0.001
  const showAmount = netAmount > 0 && currency.length > 0

  return (
    <View className="rounded-2xl border border-border bg-card p-5 shadow-md shadow-black/5">
      <View className="flex-row items-baseline justify-between">
        <View>
          <Text className="font-sans-semibold text-[12.5px] uppercase tracking-wide text-ink-3">
            {t("wasiyyah.bequestPortion")}
          </Text>
          <Text className="mt-0.5 font-display text-[32px] text-gold-deep">{pct(total)}</Text>
        </View>
        {showAmount ? (
          <View className="items-end">
            <Text className="font-mono text-[18px] text-foreground">
              {formatCurrencyAmount(currency, total * netAmount, true)}
            </Text>
            <Text className="font-sans-semibold text-[12px] text-ink-3">
              {t("wasiyyah.ofEstate", { amount: formatCurrencyAmount(currency, netAmount, true) })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* estate split: Wasiyyah vs Fara'id */}
      <View className="mt-4 h-[46px] flex-row overflow-hidden rounded-[13px] border border-border">
        {total > 0 ? (
          <View style={{ width: `${total * 100}%` }} className="overflow-hidden">
            <LinearGradient
              colors={[c.gold, c.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              {total > 0.08 ? (
                <Text className="font-heading text-[12.5px] text-white">{t("wasiyyah.wasiyyah")}</Text>
              ) : null}
            </LinearGradient>
          </View>
        ) : null}
        <View className="flex-1 items-center justify-center bg-primary-soft-2">
          <Text className="font-heading text-[12.5px] text-primary">
            {t("wasiyyah.faraidSplit", { pct: pct(1 - total) })}
          </Text>
        </View>
      </View>

      {atCap ? (
        <View className="mt-3 flex-row items-center gap-2.5 rounded-xl bg-red-soft p-3">
          <Icon as={AlertTriangle} size={18} className="text-danger" />
          <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-danger">
            {t("wasiyyah.atCap")}
          </Text>
        </View>
      ) : (
        <View className="mt-3 flex-row items-center gap-2.5 rounded-xl bg-green-soft p-3">
          <Icon as={Check} size={18} className="text-green" />
          <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-green">
            {t("wasiyyah.withinLimit", { headroom: pct(Math.max(0, cap - total)) })}
          </Text>
        </View>
      )}
    </View>
  )
}
