import { View } from "react-native"
import { Layers, Lock, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Ring } from "@/components/ui/ring"
import { StatTile } from "@/components/ui/stat-tile"
import { useThemeColors } from "@/lib/colors"
import {
  ASSETS,
  FAMILY,
  fmtAED,
  fmtShort,
  netEstate,
  totalDebts,
  totalEstate,
} from "@/lib/mock-estate"

const COMPLETENESS = 0.78
const encryptedCount = ASSETS.filter((a) => a.value > 0 || a.secret).length

/** Net-estate headline + completeness ring + quick asset/heir/encrypted counts. */
export function EstateSummaryCard() {
  const { t } = useTranslation()
  const c = useThemeColors()
  return (
    <View className="rounded-2xl border border-border bg-card p-[18px] shadow-md shadow-black/5">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text className="font-sans-semibold text-[12.5px] uppercase tracking-wide text-ink-3">
            {t("vaultHome.netEstate")}
          </Text>
          <Text className="mt-0.5 font-display text-[30px] text-foreground">
            {fmtAED(netEstate)}
          </Text>
          <Text className="mt-0.5 font-sans-medium text-[13px] text-ink-2">
            {t("vaultHome.estateBreakdown", {
              assets: fmtShort(totalEstate),
              debts: fmtShort(totalDebts),
            })}
          </Text>
        </View>
        <Ring value={COMPLETENESS} size={76} stroke={8} color={c.primary} track={c.line}>
          <Text className="font-heading-bold text-[18px] leading-none text-primary">
            78
            <Text className="font-heading-bold text-[11px] text-primary">%</Text>
          </Text>
          <Text className="mt-0.5 font-sans-semibold text-[9px] text-ink-3">
            {t("vaultHome.ready")}
          </Text>
        </Ring>
      </View>
      <View className="mt-4 flex-row gap-2">
        <StatTile icon={Layers} color={c.primary} value={ASSETS.length} label={t("vaultHome.statAssets")} />
        <StatTile icon={Users} color={c.goldDeep} value={FAMILY.length} label={t("vaultHome.statHeirs")} />
        <StatTile icon={Lock} color={c.green} value={encryptedCount} label={t("vaultHome.statEncrypted")} />
      </View>
    </View>
  )
}
