import { Pressable, View } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"
import { pct } from "@/lib/estate-summary"

const CAP_PCT = 100 / 3

/** A single Wasiyyah allocation: beneficiary name, % of estate, and a gold bar
 *  scaled to its slice of the ⅓ pot. Tap to edit. */
export function BeneficiaryCard({
  name,
  percentage,
  onEdit,
}: {
  name: string
  percentage: number
  onEdit: () => void
}) {
  const c = useThemeColors()
  const { ar } = useBrandType()
  const portion = Math.min(1, percentage / CAP_PCT)

  return (
    <Pressable
      onPress={onEdit}
      className="rounded-2xl border border-border bg-card p-[15px] shadow-sm shadow-black/5 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: c.goldDeep + "24" }}
          className="h-[46px] w-[46px] items-center justify-center rounded-full"
        >
          <Text className="font-heading text-[14px] text-gold-deep">
            {(name || "?").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-heading text-[15px] text-foreground">
            {name}
          </Text>
        </View>
        <Text className="font-heading text-[15px] text-gold-deep">{pct(percentage / 100)}</Text>
        <Icon as={ar ? ChevronLeft : ChevronRight} size={17} className="text-ink-3" />
      </View>
      <View className="mt-3 h-[7px] overflow-hidden rounded-full bg-surface-3">
        <View style={{ width: `${portion * 100}%` }} className="h-full overflow-hidden rounded-full">
          <LinearGradient
            colors={[c.gold, c.goldDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: "100%", width: "100%" }}
          />
        </View>
      </View>
    </Pressable>
  )
}
