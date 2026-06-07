import { useCallback, useRef, useState } from "react"
import { Platform, View } from "react-native"
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useThemeColors } from "@/lib/colors"

const MAX = 0.5 // the track spans 0–50% of the estate

/**
 * The Wasiyyah bequest slider that physically resists past the Sharia ⅓ cap: drag
 * stops at one-third, the bar flashes red, the track shakes and a warning haptic
 * fires. Enforces the legal invariant at the point of interaction.
 */
export function CapSlider({
  value,
  cap,
  onChange,
  capLabel,
}: {
  value: number
  cap: number
  onChange: (v: number) => void
  capLabel?: string
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const [width, setWidth] = useState(0)
  const shakeX = useSharedValue(0)
  const atCap = value >= cap - 0.001
  const lastHaptic = useRef(0)

  const capX = cap / MAX // fraction of the track where the cap sits
  const pos = value / MAX

  const hitCap = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-3, { duration: 50 }),
      withTiming(0, { duration: 50 })
    )
    const now = Date.now()
    if (Platform.OS !== "web" && now - lastHaptic.current > 350) {
      lastHaptic.current = now
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
  }, [shakeX])

  const setFromX = useCallback(
    (x: number) => {
      if (width <= 0) return
      let v = Math.max(0, Math.min(1, x / width)) * MAX
      if (v > cap) {
        v = cap
        hitCap()
      }
      onChange(v)
    },
    [width, cap, onChange, hitCap]
  )

  const pan = Gesture.Pan()
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x))
    .runOnJS(true)

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }))

  return (
    // A LOCAL gesture root: this slider lives inside a native TrueSheet, whose
    // content is presented OUTSIDE the app's root GestureHandlerRootView — without
    // a root here the Pan gesture never fires (the slider appears "dead"). An
    // explicit style keeps it hugging content instead of defaulting to flex:1.
    <GestureHandlerRootView style={{ width: "100%" }}>
      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={shakeStyle}
          className="h-[54px] justify-center"
        >
          {/* track */}
          <View className="absolute left-0 right-0 top-[23px] h-2.5 rounded-full bg-surface-3" />
          {/* permitted zone up to the cap */}
          <View
            className="absolute left-0 top-[23px] h-2.5 rounded-full bg-gold/20"
            style={{ width: `${capX * 100}%` }}
          />
          {/* fill */}
          <View
            className="absolute left-0 top-[23px] h-2.5 overflow-hidden rounded-full"
            style={{ width: `${pos * 100}%` }}
          >
            {atCap ? (
              <View className="h-full w-full bg-danger" />
            ) : (
              <LinearGradient
                colors={[c.gold, c.goldDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: "100%" }}
              />
            )}
          </View>
          {/* cap marker */}
          <View
            className="absolute top-[14px] h-7 w-0.5 rounded-sm bg-gold-deep"
            style={{ left: `${capX * 100}%` }}
          />
          {/* thumb */}
          <View
            className="absolute top-[14px] h-[30px] w-[30px] rounded-full bg-white shadow-md shadow-black/20"
            style={{
              left: `${pos * 100}%`,
              marginLeft: -15,
              borderWidth: 3,
              borderColor: atCap ? c.red : c.goldDeep,
            }}
          />
        </Animated.View>
      </GestureDetector>
      <View className="mt-0.5 flex-row justify-between">
        <Text className="font-heading text-[11px] text-ink-3">0%</Text>
        <Text className="font-heading text-[11px] text-gold-deep">{capLabel ?? t("wasiyyah.capLabel")}</Text>
        <Text className="font-heading text-[11px] text-ink-3">50%</Text>
      </View>
    </GestureHandlerRootView>
  )
}
