import { useColorScheme } from "react-native"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"

/**
 * A soft teal "vault-light" glow rendered behind the brand for atmospheric
 * depth. react-native-svg can't read Uniwind tokens, so the colors are resolved
 * by color scheme here. Kept deliberately subtle.
 */
export function VaultGlow() {
  const isLight = useColorScheme() === "light"
  // Warm bronze/gold glow to match the app accent (was teal).
  const color = isLight ? "#a26d33" : "#dcaf6c"
  const peak = isLight ? 0.08 : 0.2

  return (
    <Svg width="100%" height="100%">
      <Defs>
        <RadialGradient id="vaultGlow" cx="50%" cy="34%" r="65%">
          <Stop offset="0" stopColor={color} stopOpacity={peak} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#vaultGlow)" />
    </Svg>
  )
}
