import { useEffect } from "react"
import { Pressable, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { Delete, ScanFace } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useThemeColors } from "@/lib/colors"
import { useReducedMotion } from "@/lib/motion"

// The 3×4 keypad layout: digits, then [biometric | 0 | backspace].
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"]
// Fixed key diameter — 3 per row inside the 300px-max keypad, spread by justify-between.
const KEY_SIZE = 76

function tap() {
  // Fire-and-forget; unsupported platforms simply no-op.
  void Haptics.selectionAsync().catch(() => {})
}

/**
 * A Paysera-style numeric PIN entry: a row of dots above an on-screen keypad. The
 * parent owns the digit string (`value`) so the same pad drives enter/confirm/unlock.
 * `onComplete` fires with the full PIN on the last digit; set `error` to flash the
 * dots red + shake (the parent typically clears `value` alongside it).
 */
export function PinPad({
  value,
  onChange,
  length = 6,
  onComplete,
  showBiometric = false,
  onBiometric,
  error = false,
  disabled = false,
}: {
  value: string
  onChange: (next: string) => void
  length?: number
  onComplete?: (pin: string) => void
  showBiometric?: boolean
  onBiometric?: () => void
  error?: boolean
  disabled?: boolean
}) {
  const c = useThemeColors()
  const reduced = useReducedMotion()
  const shake = useSharedValue(0)

  // Shake + haptic error pulse whenever `error` flips on.
  useEffect(() => {
    if (!error) return
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {}
    )
    if (reduced) return
    shake.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    )
  }, [error, reduced, shake])

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }))

  function press(k: string) {
    if (disabled) return
    if (k === "bio") {
      onBiometric?.()
      return
    }
    if (k === "del") {
      if (value.length === 0) return
      tap()
      onChange(value.slice(0, -1))
      return
    }
    if (value.length >= length) return
    tap()
    const next = value + k
    onChange(next)
    if (next.length === length) onComplete?.(next)
  }

  return (
    <View className="items-center gap-9">
      {/* dots */}
      <Animated.View
        style={dotsStyle}
        className="flex-row gap-3.5"
        accessibilityLabel={`${value.length} of ${length} digits entered`}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length
          return (
            <View
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2",
                error
                  ? "border-danger bg-danger"
                  : filled
                    ? "border-primary bg-primary"
                    : "border-line-2 bg-transparent"
              )}
            />
          )
        })}
      </Animated.View>

      {/* keypad — fixed-size keys; the digit's lineHeight == key size so its leading
          splits evenly above/below the glyph (reliable vertical centering on Android). */}
      <View className="w-full max-w-[300px] flex-row flex-wrap justify-between gap-y-3.5">
        {KEYS.map((k) => {
          if (k === "bio" && !showBiometric) {
            return <View key="bio" style={{ width: KEY_SIZE, height: KEY_SIZE }} />
          }
          const isAction = k === "bio" || k === "del"
          return (
            <Pressable
              key={k}
              onPress={() => press(k)}
              disabled={disabled || (k === "del" && value.length === 0)}
              accessibilityRole="button"
              accessibilityLabel={
                k === "bio"
                  ? "Use biometrics"
                  : k === "del"
                    ? "Delete"
                    : k
              }
              style={{ width: KEY_SIZE, height: KEY_SIZE }}
              className={cn(
                "items-center justify-center rounded-full active:opacity-60",
                !isAction && "bg-surface-2",
                disabled && "opacity-40"
              )}
            >
              {k === "bio" ? (
                <Icon as={ScanFace} size={28} className="text-primary" />
              ) : k === "del" ? (
                <Icon as={Delete} size={26} className="text-ink-2" />
              ) : (
                <Text
                  className="font-display text-foreground"
                  style={{
                    fontSize: 27,
                    lineHeight: KEY_SIZE,
                    includeFontPadding: false,
                    textAlign: "center",
                  }}
                >
                  {k}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
