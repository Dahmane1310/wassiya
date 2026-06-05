import type * as React from "react"
import { Pressable, View } from "react-native"
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** One Profile list row: soft icon badge + title, optional detail/badge, chevron
 *  when pressable. `color` is a hex (resolve from `useThemeColors`). */
export function ProfileRow({
  icon: IconCmp,
  color,
  title,
  detail,
  badge,
  onPress,
  danger = false,
  last = false,
}: {
  icon: LucideIcon
  color: string
  title: string
  detail?: string
  badge?: React.ReactNode
  onPress?: () => void
  danger?: boolean
  last?: boolean
}) {
  const { ar, body } = useBrandType()
  const Container = onPress ? Pressable : View
  return (
    <Container
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 px-3.5 py-3",
        !last && "border-b border-line-2",
        onPress && "active:opacity-70"
      )}
    >
      <View
        style={{ backgroundColor: color + "1f" }}
        className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
      >
        <IconCmp size={18} color={color} strokeWidth={1.9} />
      </View>
      <Text
        numberOfLines={1}
        className={cn(
          "flex-1 text-[15px]",
          danger ? "text-danger" : "text-foreground",
          ar ? body : "font-sans-semibold"
        )}
      >
        {title}
      </Text>
      {badge}
      {detail ? (
        <Text className={cn("text-[13.5px] text-ink-3", ar ? body : "font-sans-semibold")}>
          {detail}
        </Text>
      ) : null}
      {onPress && !danger ? (
        <Icon as={ar ? ChevronLeft : ChevronRight} size={17} className="text-ink-3" />
      ) : null}
    </Container>
  )
}
