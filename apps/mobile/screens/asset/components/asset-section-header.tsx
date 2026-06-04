import { View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** A quiet, uppercase divider between the Assets and Debts groups. */
export function AssetSectionHeader({ title }: { title: string }) {
  const { ar, body } = useBrandType()
  return (
    <View className="pb-3 pt-6">
      <Text
        className={cn(
          "text-xs text-muted-foreground",
          ar ? body : "font-sans-medium uppercase tracking-wider",
        )}
      >
        {title}
      </Text>
    </View>
  )
}
