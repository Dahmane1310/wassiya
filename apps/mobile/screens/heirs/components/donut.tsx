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
import { Text } from "@workspace/ui-native/components/ui/text"
import { useThemeColors } from "@/lib/colors"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const GAP = 0.012 // fractional gap between segments
const EASE = Easing.bezier(0.22, 1, 0.36, 1)

export type DonutDatum = { id: string; color: string; value: number }

/**
 * Segmented donut of Fara'id shares. One segment is rendered per heir slot (fixed
 * set → stable hooks); each animates its arc length + offset whenever the living/
 * deceased toggles recompute shares, so the ring visibly "rebalances".
 */
export function Donut({
  data,
  size = 210,
  stroke = 26,
  activeId,
  onPick,
  centerTop,
  centerMain,
  centerSub,
}: {
  data: DonutDatum[]
  size?: number
  stroke?: number
  activeId?: string | null
  onPick?: (id: string) => void
  centerTop: string
  centerMain: string
  centerSub: string
}) {
  const c = useThemeColors()
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r

  // Cumulative offset per segment (in fractions of the circle).
  let acc = 0
  const segs = data.map((d) => {
    const offset = acc
    acc += d.value
    return { ...d, offset }
  })

  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c.line2}
          strokeWidth={stroke}
        />
        {segs.map((s) => (
          <Segment
            key={s.id}
            cx={size / 2}
            cy={size / 2}
            r={r}
            circ={circ}
            stroke={stroke}
            color={s.color}
            value={s.value}
            offset={s.offset}
            active={activeId === s.id}
            dimmed={!!activeId && activeId !== s.id}
            onPress={() => onPick?.(s.id)}
          />
        ))}
      </Svg>
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <Text className="font-sans-semibold text-[11px] uppercase tracking-wide text-ink-3">
          {centerTop}
        </Text>
        <Text className="mt-0.5 font-display text-[24px] text-foreground">{centerMain}</Text>
        <Text className="mt-0.5 font-sans-semibold text-[12px] text-ink-2">{centerSub}</Text>
      </View>
    </View>
  )
}

function Segment({
  cx,
  cy,
  r,
  circ,
  stroke,
  color,
  value,
  offset,
  active,
  dimmed,
  onPress,
}: {
  cx: number
  cy: number
  r: number
  circ: number
  stroke: number
  color: string
  value: number
  offset: number
  active: boolean
  dimmed: boolean
  onPress: () => void
}) {
  const reduced = useReducedMotion()
  const len = useSharedValue(0)
  const off = useSharedValue(0)

  useEffect(() => {
    const targetLen = Math.max(0, value - GAP) * circ
    const targetOff = -offset * circ
    if (reduced) {
      len.value = targetLen
      off.value = targetOff
    } else {
      len.value = withTiming(targetLen, { duration: 900, easing: EASE })
      off.value = withTiming(targetOff, { duration: 900, easing: EASE })
    }
  }, [value, offset, circ, reduced, len, off])

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [len.value, circ - len.value],
    strokeDashoffset: off.value,
  }))

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={active ? stroke + 5 : stroke}
      strokeLinecap="butt"
      opacity={dimmed ? 0.4 : 1}
      animatedProps={animatedProps}
      onPress={onPress}
    />
  )
}
