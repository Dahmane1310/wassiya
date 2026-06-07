import { Pressable, View } from "react-native"
import { ChevronLeft, ChevronRight, Lock, Paperclip } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Card } from "@workspace/ui-native/components/ui/card"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { type AssetSummary } from "@/hooks/use-assets"
import { categoryIcon, categoryTint } from "@/lib/asset-categories"
import { summaryDetail } from "@/lib/asset-fields"
import { type AssetPayload } from "@/lib/asset-crypto"
import { formatCurrencyAmount } from "@/lib/estate-summary"

// Debt rows wear a destructive tint regardless of category — the chip is the
// at-a-glance "this is owed, not owned" signal inside the Debts group.
const DEBT_TINT = { bg: "bg-destructive/10", fg: "text-destructive" }

/**
 * One asset/debt row. The payload is already decrypted upstream (the whole list
 * is unwrapped once at the screen so the estate can be totalled); a null payload
 * means THIS row alone failed to decrypt and is shown in isolation.
 */
export function AssetListItem({
  row,
  payload,
  onPress,
}: {
  row: AssetSummary
  payload: AssetPayload | null
  onPress: () => void
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()

  if (payload === null) {
    return (
      <Card className="px-4 py-3">
        <Text className={cn("text-sm text-destructive", body)}>
          {t("asset.error.load")}
        </Text>
      </Card>
    )
  }

  const isDebt = payload.kind === "debt"
  const tint = isDebt ? DEBT_TINT : categoryTint(payload.category)
  const CategoryIcon = categoryIcon(payload.category)

  // For an asset, prefer the at-a-glance category detail (area / model / bank)
  // over the bare category name; debts keep the category for the "what kind" cue.
  const detail = isDebt ? null : summaryDetail(payload.category, payload.details)
  const subtitle = detail ?? t(`asset.category.${payload.category}`)

  const hasValue = payload.value !== null && Number.isFinite(payload.value)
  const valueText = hasValue
    ? (isDebt ? "−" : "") +
      formatCurrencyAmount(payload.currency ?? "", Math.abs(payload.value!), true)
    : null

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={payload.label}
      className="active:opacity-70"
    >
      <Card className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3">
        <View
          className={cn(
            "h-11 w-11 items-center justify-center rounded-[13px]",
            tint.bg,
          )}
        >
          <Icon as={CategoryIcon} className={tint.fg} size={20} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className={cn("text-[15px] text-foreground", ar ? body : "font-sans-semibold")}
          >
            {payload.label}
          </Text>
          <View className="flex-row items-center gap-1.5">
            {/* lock glyph reinforces "encrypted on-device" at a glance */}
            <Icon as={Lock} className="text-green" size={12} />
            <Text numberOfLines={1} className={cn("flex-shrink text-xs text-ink-3", body)}>
              {subtitle}
            </Text>
            {row.storageId ? (
              <Icon as={Paperclip} className="text-ink-3" size={12} />
            ) : null}
          </View>
        </View>
        {valueText ? (
          <Text
            numberOfLines={1}
            className={cn(
              "font-mono text-[13.5px]",
              isDebt ? "text-danger" : "text-foreground",
            )}
          >
            {valueText}
          </Text>
        ) : null}
        <Icon
          as={ar ? ChevronLeft : ChevronRight}
          className="text-ink-3"
          size={18}
        />
      </Card>
    </Pressable>
  )
}
