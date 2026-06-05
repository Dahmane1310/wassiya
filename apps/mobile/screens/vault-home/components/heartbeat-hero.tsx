import { Pressable, View } from "react-native"
import Animated from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { Activity, AlertTriangle, Check, Heart } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import type { SwitchStatus } from "@/hooks/use-switch"
import { useThemeColors } from "@/lib/colors"
import { useHeartbeat, usePop, usePulseRings } from "@/lib/motion"

/**
 * The dead-man's switch as a living heartbeat — styled like the Profile identity
 * card: a faint bronze→card wash with an outlined gold disc (not a bold filled
 * one). The disc beats; "I'm here" records a check-in. Grace turns red.
 */
export function HeartbeatHero({
  status,
  streak,
  nextDue,
  cadence,
  graceDays,
  justChecked,
  onCheckIn,
}: {
  status: SwitchStatus
  streak: number
  nextDue: number
  cadence: number
  graceDays: number
  justChecked: boolean
  onCheckIn: () => void
}) {
  const { t } = useTranslation()
  const { display, body, ar } = useBrandType()
  const c = useThemeColors()
  const rings = usePulseRings(2)
  const beat = useHeartbeat(!justChecked)
  const pop = usePop(justChecked)

  const isGrace = status === "grace" || status === "pendingVerification"
  // The beating heart + pulse rings stay the "alive" green (red in grace); the
  // card wash, chip and button keep the bronze accent.
  const accent = isGrace ? c.red : c.green

  const title = justChecked
    ? t("vaultHome.heroLogged")
    : isGrace
      ? t("vaultHome.graceTitle")
      : t("vaultHome.heroListening")

  const subtitle =
    isGrace && !justChecked
      ? t("vaultHome.graceCountdown", { days: nextDue })
      : t("vaultHome.nextDue", { days: nextDue, streak })

  return (
    <View className="overflow-hidden rounded-[28px] border border-border shadow-md shadow-black/5">
      {/* Faint bronze → card wash, exactly like the Profile identity card. */}
      <LinearGradient
        colors={[(isGrace ? c.red : c.gold) + "26", c.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center justify-between">
          {isGrace ? (
            <View className="flex-row items-center gap-1.5 self-start rounded-full bg-red-soft px-3 py-1.5">
              <Icon as={AlertTriangle} size={12} className="text-danger" />
              <Text className={cn("text-[11px] tracking-wide text-danger", ar ? body : "font-sans-semibold")}>
                {t("vaultHome.graceChip")}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5 self-start rounded-full bg-green-soft px-3 py-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-green" />
              <Text className={cn("text-[11px] tracking-wide text-green", ar ? body : "font-sans-semibold")}>
                {t("vaultHome.armed")}
              </Text>
            </View>
          )}
          <Text className={cn("text-[12.5px] text-ink-3", ar ? body : "font-sans-semibold")}>
            {t("vaultHome.cadence", { days: cadence })}
          </Text>
        </View>

        {/* outlined, avatar-style beating disc (a hint of bronze, not a bold fill) */}
        <View className="items-center pb-1 pt-3">
          <View className="h-[120px] w-[120px] items-center justify-center">
            {!justChecked
              ? rings.map((style, i) => (
                  <Animated.View
                    key={i}
                    pointerEvents="none"
                    style={[
                      {
                        position: "absolute",
                        height: 80,
                        width: 80,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: accent,
                      },
                      style,
                    ]}
                  />
                ))
              : null}
            <Animated.View
              style={[justChecked ? pop : beat, { backgroundColor: accent + "1f", borderColor: accent }]}
              className="h-[92px] w-[92px] items-center justify-center rounded-full border-2"
            >
              {justChecked ? (
                <Check size={42} color={accent} strokeWidth={2.4} />
              ) : (
                <Heart size={42} color={accent} fill={accent} strokeWidth={1.6} />
              )}
            </Animated.View>
          </View>

          <Text className={cn("mt-2 text-[23px] text-foreground", display)}>{title}</Text>
          <Text className={cn("mt-1 text-center text-[14px] text-ink-2", body)}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={onCheckIn}
          className="mt-3.5 h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-gold-deep active:opacity-90"
        >
          <Activity size={20} color="#ffffff" strokeWidth={2.4} />
          <Text className={cn("text-[16.5px] text-white", ar ? body : "font-heading")}>
            {t("vaultHome.checkIn")}
          </Text>
        </Pressable>

        <Text className="mt-3 text-center text-[12px] leading-5 text-ink-3">
          {isGrace ? t("vaultHome.graceNoteUrgent") : t("vaultHome.graceNote", { days: graceDays })}
        </Text>
      </LinearGradient>
    </View>
  )
}
