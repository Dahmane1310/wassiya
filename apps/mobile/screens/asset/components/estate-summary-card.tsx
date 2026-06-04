import { View } from "react-native"
import { Scale, Vault } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui-native/components/ui/card"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
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

/** The Vault tab's hero: the owner's net estate. Labelled "Net estate" with an
 *  explicit "after … in debts" line so the figure is never mistaken for a gross
 *  total — debts are visibly deducted. Currencies never merge: the largest nets
 *  big, the rest list underneath. Pure presentation; the math is upstream. */
export function EstateSummaryCard({ summary }: { summary: EstateSummary }) {
  const { t } = useTranslation()
  const { ar, body, display, tracking } = useBrandType()
  const { primary, currencies, assetCount, debtCount } = summary

  const eyebrow = ar ? body : "font-sans-medium uppercase tracking-wider"

  return (
    <Card className="border-0 bg-primary shadow-md shadow-primary/30">
      <CardContent className="gap-4">
        <Text className={cn("text-xs text-primary-foreground/70", eyebrow)}>
          {t("asset.summary.netEstate")}
        </Text>

        {primary ? (
          <View className="gap-1">
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              className={cn(
                "text-4xl text-primary-foreground",
                display,
                tracking,
              )}
              maxFontSizeMultiplier={1.2}
            >
              {signed(primary)}
            </Text>
            {primary.debts > 0 ? (
              <Text className={cn("text-xs text-primary-foreground/70", body)}>
                {t("asset.summary.afterDebts", {
                  amount: formatCurrencyAmount(primary.currency, primary.debts),
                })}
              </Text>
            ) : null}
            {currencies.slice(1).map((net) => (
              <Text
                key={net.currency || "_"}
                className={cn("text-sm text-primary-foreground/70", body)}
              >
                {signed(net)}
              </Text>
            ))}
          </View>
        ) : (
          <Text className={cn("text-base text-primary-foreground/80", body)}>
            {t("asset.summary.noValues")}
          </Text>
        )}

        <View className="h-px bg-primary-foreground/15" />

        <View className="flex-row items-center gap-6">
          <CountStat icon={Vault} count={assetCount} label={t("asset.summary.assets")} />
          <CountStat icon={Scale} count={debtCount} label={t("asset.summary.debts")} />
        </View>
      </CardContent>
    </Card>
  )
}

function CountStat({
  icon,
  count,
  label,
}: {
  icon: typeof Vault
  count: number
  label: string
}) {
  const { ar, body } = useBrandType()
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={icon} className="text-primary-foreground/70" size={16} />
      <Text className={cn("text-sm text-primary-foreground", body)}>
        <Text className={cn("text-primary-foreground", ar ? body : "font-sans-semibold")}>
          {count}
        </Text>
        {" "}
        {label}
      </Text>
    </View>
  )
}
