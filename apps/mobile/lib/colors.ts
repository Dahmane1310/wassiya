import { useColorScheme } from "react-native"

/**
 * Hex mirror of the Uniwind design tokens (global.css), per color scheme.
 *
 * react-native-svg, Reanimated interpolations and a few gradient/canvas contexts
 * can't read Uniwind className tokens — they need concrete color values. These hexes
 * are the exact oklch tokens from global.css, pre-converted with culori. Keep them in
 * sync with global.css: if a token value changes there, regenerate the matching entry.
 *
 * For everything that takes a className, use the token utilities (bg-primary, text-gold,
 * border-border, …) instead — those stay live across theme toggles. This map is the
 * escape hatch for SVG/animation only.
 */
export type ThemeColors = {
  primary: string
  primary600: string
  green: string
  gold: string
  goldDeep: string
  ink: string
  ink2: string
  ink3: string
  line: string
  line2: string
  card: string
  surface2: string
  surface3: string
  red: string
  vault2: string
  background: string
  /** Extra hues used only for distinguishing heirs in the Fara'id donut/avatars. */
  violet: string
  teal: string
}

const LIGHT: ThemeColors = {
  // primary = bronze/gold (the single dominant accent; was trust-blue)
  primary: "#a26d33",
  primary600: "#8c5413",
  green: "#42926b",
  gold: "#c79350",
  goldDeep: "#a26d33",
  ink: "#1a2027",
  ink2: "#5e646b",
  ink3: "#8d939a",
  line: "#e5e2de",
  line2: "#efece8",
  card: "#ffffff",
  surface2: "#f9f6f2",
  surface3: "#f5f2ed",
  red: "#c43f3e",
  vault2: "#1c1611",
  background: "#fcf9f5",
  violet: "#635ea5",
  teal: "#008388",
}

const DARK: ThemeColors = {
  primary: "#b48137",
  primary600: "#dcaf6c",
  green: "#5bb38a",
  gold: "#dcaf6c",
  goldDeep: "#b48137",
  ink: "#f6f3ef",
  ink2: "#b5b0a9",
  ink3: "#857f79",
  line: "#393431",
  line2: "#2d2926",
  card: "#211c19",
  surface2: "#292421",
  surface3: "#332e2a",
  red: "#ea6a64",
  vault2: "#231d18",
  background: "#15120f",
  violet: "#7a76bf",
  teal: "#1c989e",
}

export const themeColors = { light: LIGHT, dark: DARK }

/** Resolve the hex palette for the active color scheme (SVG / animation contexts). */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === "dark" ? DARK : LIGHT
}

/**
 * Stable, distinct hues to color each heir's donut segment + avatar (mirrors the
 * design's HEIR_COLORS). Cycled by index so any heir count stays legible.
 */
export function heirPalette(c: ThemeColors): string[] {
  // Distinct hues first (primary is now gold, so lead with non-gold colors).
  return [c.teal, c.violet, c.green, c.red, c.goldDeep, c.gold, c.primary600]
}
