import { Pressable, View } from "react-native"
import { X } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useBrandType } from "@/hooks/use-brand-type"
import { cn } from "@workspace/ui-native/lib/utils"

/** Title + subtitle + close button for a bottom-sheet flow. */
export function SheetHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle?: string
  onClose: () => void
}) {
  const { display, body } = useBrandType()
  return (
    <View className="flex-row items-start gap-3 px-5 pb-1 pt-2.5">
      <View className="flex-1">
        <Text className={cn("text-[23px] text-foreground", display)}>{title}</Text>
        {subtitle ? (
          <Text className={cn("mt-0.5 text-[13.5px] text-ink-2", body)}>{subtitle}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        className="h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-3 active:opacity-70"
      >
        <Icon as={X} size={18} className="text-ink-2" />
      </Pressable>
    </View>
  )
}
