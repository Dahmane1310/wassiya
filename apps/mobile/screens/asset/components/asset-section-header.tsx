import { View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** A quiet, uppercase divider between the Assets and Debts groups. */
export function AssetSectionHeader({ title }: { title: string }) {
  const { ar, body } = useBrandType()
  return (
    <View className="px-1 pb-2.5 pt-5">
      <Text
        className={cn(
          "text-xs text-ink-3",
          ar ? body : "font-sans-semibold uppercase tracking-wide",
        )}
      >
        {title}
      </Text>
    </View>
  )
}
