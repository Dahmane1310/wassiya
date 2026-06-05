import { useEffect } from "react"
import {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

const PULSE_MS = 2600
const HEART_MS = 2600

/**
 * Expanding "listening" rings (the heartbeat signature, also reused by the
 * encrypt animation and onboarding). Returns one animated style per ring; each
 * scales out and fades, staggered. Collapses to static when reduce-motion is on.
 */
export function usePulseRings(count = 2, duration = PULSE_MS) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (reduced) return
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
      -1,
      false
    )
    return () => cancelAnimation(progress)
  }, [reduced, duration, progress])

  // Hooks can't be called in a loop with a dynamic count, so cap at a small max
  // and slice. Four covers every caller (heartbeat=2, encrypt=2, onboarding=2).
  // Stagger as a fraction of the loop period so rings stay evenly spaced at any duration.
  const s0 = useStaggeredRing(progress, 0 / count, reduced)
  const s1 = useStaggeredRing(progress, 1 / count, reduced)
  const s2 = useStaggeredRing(progress, 2 / count, reduced)
  const s3 = useStaggeredRing(progress, 3 / count, reduced)
  return [s0, s1, s2, s3].slice(0, count)
}

function useStaggeredRing(
  progress: { value: number },
  offset: number,
  reduced: boolean
) {
  return useAnimatedStyle(() => {
    if (reduced) return { opacity: 0 }
    // Offset each ring's phase by `offset` (a 0–1 fraction of the loop period).
    const phase = (progress.value + offset) % 1
    return {
      transform: [{ scale: interpolate(phase, [0, 1], [1, 2.1]) }],
      opacity: interpolate(phase, [0, 0.7, 1], [0.55, 0, 0]),
    }
  })
}

/**
 * The double-thump heartbeat scale for the central disc. Mirrors the design's
 * `wHeart` keyframe (two quick beats then rest).
 */
export function useHeartbeat(active = true) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)

  useEffect(() => {
    if (reduced || !active) {
      scale.value = 1
      return
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: HEART_MS * 0.14 }),
        withTiming(1, { duration: HEART_MS * 0.14 }),
        withTiming(1.05, { duration: HEART_MS * 0.14 }),
        withTiming(1, { duration: HEART_MS * 0.58 })
      ),
      -1,
      false
    )
    return () => cancelAnimation(scale)
  }, [reduced, active, scale])

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
}

/** A single "pop" entrance (scale 0.6 → 1.08 → 1), e.g. the check-in confirm. */
export function usePop(trigger: unknown) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(reduced ? 1 : 0.6)
  useEffect(() => {
    if (reduced) {
      scale.value = 1
      return
    }
    scale.value = withSequence(
      withTiming(1.08, { duration: 220, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 160 })
    )
  }, [trigger, reduced, scale])
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
}

export { useReducedMotion }
