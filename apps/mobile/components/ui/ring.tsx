import type * as React from "react"
import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

/**
 * Animated circular progress ring (estate completeness). The stroke sweeps in on
 * mount and re-animates when `value` changes. `color`/`track` are concrete hexes
 * (react-native-svg can't read Uniwind tokens) — pass from `useThemeColors()`.
 */
export function Ring({
  value,
  size = 72,
  stroke = 7,
  color,
  track,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color: string
  track: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? value : 0)

  useEffect(() => {
    progress.value = reduced
      ? value
      : withTiming(value, { duration: 1100, easing: Easing.out(Easing.cubic) })
  }, [value, reduced, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }))

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
        />
      </Svg>
      {children ? (
        <View
          style={StyleSheet.absoluteFill}
          className="items-center justify-center"
        >
          {children}
        </View>
      ) : null}
    </View>
  )
}
