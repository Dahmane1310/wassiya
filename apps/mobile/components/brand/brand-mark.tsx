import { View } from "react-native"
import { ShieldCheck } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"

type BrandMarkProps = {
  /** Width/height of the square mark in px. */
  size?: number
  className?: string
  accessibilityLabel?: string
}

/**
 * The Wassiya brand mark: a teal "vault tile" carrying a gold protection glyph.
 * v1 is composed from a themed tile + a Lucide icon so it adapts to light/dark
 * for free via the `bg-primary` / `text-gold` tokens. The corner radius scales
 * with `size`. (Follow-up: a bespoke sealed-vault SVG glyph.)
 */
export function BrandMark({
  size = 72,
  className,
  accessibilityLabel = "Wassiya",
}: BrandMarkProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        "border-gold/25 items-center justify-center border bg-primary",
        className
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
      }}
    >
      {/* `size` prop overrides the icon's default size class; `text-gold` sets color. */}
      <Icon
        as={ShieldCheck}
        className="text-gold"
        size={Math.round(size * 0.5)}
      />
    </View>
  )
}
