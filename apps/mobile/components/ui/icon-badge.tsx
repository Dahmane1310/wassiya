import { View } from "react-native"
import type { LucideIcon } from "lucide-react-native"

/**
 * Rounded-square category/icon badge with a soft tint of `color`.
 *
 * Takes a concrete hex `color` (resolve from `useThemeColors()` at the call site)
 * rather than a token class, so any hue — including the violet/teal category tints
 * that have no Uniwind token — works uniformly. Re-renders on theme change because
 * callers read the palette via `useColorScheme`.
 */
export function IconBadge({
  icon: IconCmp,
  color,
  size = 44,
  radius = 13,
  soft = true,
}: {
  icon: LucideIcon
  color: string
  size?: number
  radius?: number
  soft?: boolean
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: "center",
        justifyContent: "center",
        // 12% alpha tint over the surface when soft; solid fill otherwise.
        backgroundColor: soft ? color + "1f" : color,
      }}
    >
      <IconCmp
        size={Math.round(size * 0.5)}
        color={soft ? color : "#ffffff"}
        strokeWidth={1.9}
      />
    </View>
  )
}
