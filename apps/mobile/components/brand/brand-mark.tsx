import { Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { cn } from "@workspace/ui-native/lib/utils"
import { useThemeColors } from "@/lib/colors"

type BrandMarkProps = {
  /** Width/height of the square mark in px. */
  size?: number
  className?: string
  accessibilityLabel?: string
}

/**
 * The Wassiya brand mark: the unified W-square monogram (placeholder until the
 * real mark is designed) — same spec as the web logo.tsx and landing WMark.
 * LinearGradient needs concrete colors, so the gold pair comes from
 * useThemeColors() (theme-aware hex mirror of the tokens). The "W" is raw RN
 * Text with an explicit Inter family: a brand glyph, not copy, so it must NOT
 * swap to Tajawal under RTL like the ui-native Text wrapper would.
 */
export function BrandMark({
  size = 72,
  className,
  accessibilityLabel = "Wassiya",
}: BrandMarkProps) {
  const c = useThemeColors()
  return (
    <LinearGradient
      colors={[c.gold, c.goldDeep]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn("items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: "Inter_800ExtraBold",
          fontSize: Math.round(size * 0.52),
          color: "#fff",
          letterSpacing: -0.5,
        }}
      >
        W
      </Text>
    </LinearGradient>
  )
}
