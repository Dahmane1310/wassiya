import { View } from "react-native"
import type { LucideIcon } from "lucide-react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** A compact metric tile (icon + big number + label) used in the estate summary. */
export function StatTile({
  icon: IconCmp,
  color,
  value,
  label,
}: {
  icon: LucideIcon
  color: string
  value: number | string
  label: string
}) {
  const { ar, body } = useBrandType()
  return (
    <View className="flex-1 items-center rounded-2xl bg-surface-2 px-2.5 py-3">
      <IconCmp size={19} color={color} strokeWidth={2} />
      <Text className="mt-1.5 font-heading-bold text-xl tracking-tight text-foreground">
        {value}
      </Text>
      <Text className={cn("mt-0.5 text-[11px] text-ink-3", ar ? body : "font-sans-semibold")}>
        {label}
      </Text>
    </View>
  )
}
