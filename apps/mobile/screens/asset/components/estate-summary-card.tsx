import { View } from "react-native"
import { ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { LinearGradient } from "expo-linear-gradient"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pill } from "@/components/ui/pill"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"
import {
  formatCurrencyAmount,
  type CurrencyNet,
  type EstateSummary,
} from "@/lib/estate-summary"

// U+2212 minus — reads better than a hyphen against large numerals.
const MINUS = "−"

function signed(net: CurrencyNet): string {
  const body = formatCurrencyAmount(net.currency, Math.abs(net.net))
  return net.net < 0 ? `${MINUS}${body}` : body
}

/** The Assets tab banner: the owner's net estate over a soft trust-blue→bronze
 *  gradient, with an at-a-glance "zero-knowledge / AES-256" reassurance. Labelled
 *  "Net estate" with an explicit "after … in debts" line so it's never mistaken
 *  for a gross total. Pure presentation; the math is computed upstream. */
export function EstateSummaryCard({ summary }: { summary: EstateSummary }) {
  const { t } = useTranslation()
  const { ar, body, display, tracking } = useBrandType()
  const c = useThemeColors()
  const { primary, currencies } = summary

  const eyebrow = ar ? body : "font-sans-semibold uppercase tracking-wide"

  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      <LinearGradient
        colors={[c.primary + "1f", c.gold + "1f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View className="min-w-0 flex-1 gap-1">
          <Text className={cn("text-xs text-ink-2", eyebrow)}>
            {t("asset.summary.netEstate")}
          </Text>
          {primary ? (
            <>
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                className={cn("text-[27px] text-foreground", display, tracking)}
                maxFontSizeMultiplier={1.2}
              >
                {signed(primary)}
              </Text>
              {primary.debts > 0 ? (
                <Text className={cn("text-xs text-ink-2", body)}>
                  {t("asset.summary.afterDebts", {
                    amount: formatCurrencyAmount(primary.currency, primary.debts),
                  })}
                </Text>
              ) : null}
              {currencies.slice(1).map((net) => (
                <Text key={net.currency || "_"} className={cn("text-sm text-ink-2", body)}>
                  {signed(net)}
                </Text>
              ))}
            </>
          ) : (
            <Text className={cn("text-base text-ink-2", body)}>
              {t("asset.summary.noValues")}
            </Text>
          )}
        </View>
        <View className="items-end gap-1.5">
          <Pill tone="green" icon={ShieldCheck}>
            AES-256
          </Pill>
          <Text className={cn("text-[11.5px] text-ink-3", ar ? body : "font-sans-semibold")}>
            {t("asset.summary.zeroKnowledge")}
          </Text>
        </View>
      </LinearGradient>
    </View>
  )
}
