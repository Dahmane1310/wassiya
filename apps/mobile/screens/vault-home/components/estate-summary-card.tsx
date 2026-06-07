import { View } from "react-native"
import { Layers, Lock, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Ring } from "@/components/ui/ring"
import { StatTile } from "@/components/ui/stat-tile"
import { useDecryptedAssets } from "@/hooks/use-decrypted-assets"
import { useThemeColors } from "@/lib/colors"
import { formatCurrencyAmount } from "@/lib/estate-summary"
import { useVaultSetup } from "@/screens/vault-home/hooks/use-vault-setup"
import { useMasterKey } from "@/stores/vault"

// U+2212 minus — reads better than a hyphen against large numerals.
const MINUS = "−"

/**
 * Net-estate headline + readiness ring + record/heir/encrypted counts. The net
 * figure is derived from the *decrypted* asset payloads, so it shows only when
 * the vault is unlocked (the home tab is reachable while locked); the counts come
 * from row metadata alone and show either way. The ring reflects real setup
 * progress, shared with the SetupChecklist via `useVaultSetup`.
 */
export function EstateSummaryCard() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const masterKey = useMasterKey()
  const { summary } = useDecryptedAssets()
  const setup = useVaultSetup()
  const assetRows = useQuery(api.assets.listAssets)
  const heirRows = useQuery(api.familyMembers.listFamilyMembers)

  const recordCount = assetRows?.length ?? 0
  const heirCount = heirRows?.length ?? 0
  const unlocked = masterKey !== null
  const primary = summary.primary
  const readyPct = Math.round(setup.completeness * 100)

  return (
    <View className="rounded-2xl border border-border bg-card p-[18px] shadow-md shadow-black/5">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text className="font-sans-semibold text-[12.5px] uppercase tracking-wide text-ink-3">
            {t("vaultHome.netEstate")}
          </Text>
          {!unlocked ? (
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <Icon as={Lock} size={15} className="text-ink-3" />
              <Text className="font-sans-semibold text-[15px] text-ink-2">
                {t("vaultHome.unlockToView")}
              </Text>
            </View>
          ) : primary ? (
            <>
              <Text
                className="mt-0.5 font-display text-[30px] text-foreground"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {(primary.net < 0 ? MINUS : "") +
                  formatCurrencyAmount(primary.currency, Math.abs(primary.net))}
              </Text>
              {primary.debts > 0 ? (
                <Text className="mt-0.5 font-sans-medium text-[13px] text-ink-2">
                  {t("vaultHome.estateBreakdown", {
                    assets: formatCurrencyAmount(primary.currency, primary.assets, true),
                    debts: formatCurrencyAmount(primary.currency, primary.debts, true),
                  })}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="mt-1.5 font-sans-medium text-[14px] leading-[1.35] text-ink-2">
              {t("asset.summary.noValues")}
            </Text>
          )}
        </View>
        <Ring value={setup.completeness} size={76} stroke={8} color={c.primary} track={c.line}>
          <Text className="font-heading-bold text-[18px] leading-none text-primary">
            {readyPct}
            <Text className="font-heading-bold text-[11px] text-primary">%</Text>
          </Text>
          <Text className="mt-0.5 font-sans-semibold text-[9px] text-ink-3">
            {t("vaultHome.ready")}
          </Text>
        </Ring>
      </View>
      <View className="mt-4 flex-row gap-2">
        <StatTile icon={Layers} color={c.primary} value={recordCount} label={t("vaultHome.statAssets")} />
        <StatTile icon={Users} color={c.goldDeep} value={heirCount} label={t("vaultHome.statHeirs")} />
        <StatTile icon={Lock} color={c.green} value={recordCount} label={t("vaultHome.statEncrypted")} />
      </View>
    </View>
  )
}
