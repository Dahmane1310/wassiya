import { Pressable, View } from "react-native"
import { Pencil } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

type StepHeroProps = {
  title: string
  subhead?: string
  /** A tappable chip (the entered email) that jumps back to edit it. */
  pill?: { label: string; onPress: () => void; accessibilityLabel: string }
}

/** The centered headline block every auth step shares: serif/Tajawal display
 *  title, optional subhead, optional email chip — mirrors the Welcome hero. */
export function StepHero({ title, subhead, pill }: StepHeroProps) {
  const { display, body, tracking } = useBrandType()
  return (
    <View className="items-center gap-3 px-2">
      <Text
        accessibilityRole="header"
        className={cn(
          "text-center text-[26px] leading-snug text-foreground",
          display,
          tracking
        )}
        maxFontSizeMultiplier={1.3}
      >
        {title}
      </Text>
      {subhead ? (
        <Text className={cn("text-center text-[14px] leading-relaxed text-ink-2", body)}>
          {subhead}
        </Text>
      ) : null}
      {pill ? (
        <Pressable
          onPress={pill.onPress}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={pill.accessibilityLabel}
          className="flex-row items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 active:opacity-70"
        >
          <Text className="font-sans-semibold text-[13px] text-foreground">
            {pill.label}
          </Text>
          <Icon as={Pencil} size={12} className="text-ink-3" />
        </Pressable>
      ) : null}
    </View>
  )
}
