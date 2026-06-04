import { Pressable, View } from "react-native"
import { router } from "expo-router"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** Detail / form header: an in-screen back control (the nested Stack hides the
 *  native header) + the screen title. RTL-aware chevron. */
export function AssetScreenHeader({ title }: { title: string }) {
  const { ar, display, tracking } = useBrandType()

  return (
    <View className="flex-row items-center gap-1 pt-2 pb-4">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Icon
          as={ar ? ChevronRight : ChevronLeft}
          className="text-foreground"
          size={24}
        />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className={cn("flex-1 text-2xl text-foreground", display, tracking)}
        maxFontSizeMultiplier={1.3}
      >
        {title}
      </Text>
    </View>
  )
}
