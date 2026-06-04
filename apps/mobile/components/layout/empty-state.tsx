import { View } from "react-native"
import { type LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/**
 * Centered empty-state block (icon in a soft circle + title + body). Shared by
 * the feature tabs that have no content yet (Vault, People).
 */
export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}) {
  const { display, body: bodyFont, tracking } = useBrandType()

  return (
    <View className="flex-1 items-center justify-center gap-5">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon as={icon} className="text-primary" size={34} />
      </View>
      <View className="items-center gap-2 px-2">
        <Text
          accessibilityRole="header"
          className={cn(
            "text-center text-xl text-foreground",
            display,
            tracking
          )}
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>
        <Text
          className={cn(
            "text-center text-base leading-relaxed text-muted-foreground",
            bodyFont
          )}
        >
          {body}
        </Text>
      </View>
    </View>
  )
}
