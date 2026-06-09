import { Pressable } from "react-native"
import { Plus, type LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"

/**
 * Floating action button — the primary "add" affordance on list/tab screens.
 * Drop it into `ScreenContainer`'s `fab` slot, which anchors it bottom-right above
 * the tab bar. Consistent bronze primary across every screen.
 */
export function Fab({
  onPress,
  label,
  icon = Plus,
}: {
  onPress: () => void
  label: string
  icon?: LucideIcon
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-[56px] w-[56px] items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:opacity-80"
    >
      <Icon as={icon} size={26} className="text-primary-foreground" />
    </Pressable>
  )
}
