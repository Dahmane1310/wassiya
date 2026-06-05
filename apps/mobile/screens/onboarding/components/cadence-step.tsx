import { Pressable, View } from "react-native"
import { Clock } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pill } from "@/components/ui/pill"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"

const OPTIONS = [
  { days: 30, tone: "green" as const, tag: "recommended" },
  { days: 60, tone: "neutral" as const, tag: "relaxed" },
  { days: 90, tone: "neutral" as const, tag: "minimal" },
]

/** "Set your heartbeat" — choose the check-in cadence (front-end only; the switch
 *  backend isn't built yet), then arm the vault. */
export function CadenceStep({
  value,
  onChange,
  onArm,
}: {
  value: number
  onChange: (days: number) => void
  onArm: () => void
}) {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  const c = useThemeColors()

  return (
    <View className="flex-1 gap-5 pt-1">
      <View className="gap-2">
        <Text className={cn("text-[28px] leading-[1.1] text-foreground", display, tracking)}>
          {t("cadence.title")}
        </Text>
        <Text className={cn("text-[14.5px] leading-relaxed text-ink-2", body)}>
          {t("cadence.subtitle")}
        </Text>
      </View>

      <View className="gap-2.5">
        {OPTIONS.map((o) => {
          const on = value === o.days
          return (
            <Pressable
              key={o.days}
              onPress={() => onChange(o.days)}
              className={cn(
                "flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80",
                on ? "border-primary bg-primary-soft" : "border-border bg-card"
              )}
            >
              <View
                className="h-6 w-6 items-center justify-center rounded-full border-2"
                style={{ borderColor: on ? c.primary : c.line }}
              >
                {on ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </View>
              <Text className={cn("flex-1 text-[15.5px] text-foreground", body)}>
                {t("cadence.everyDays", { days: o.days })}
              </Text>
              <Pill tone={o.tone}>{t(`cadence.${o.tag}`)}</Pill>
            </Pressable>
          )
        })}
      </View>

      <View className="flex-row items-center gap-2.5 rounded-2xl bg-surface-2 p-3.5">
        <Icon as={Clock} size={18} className="text-ink-2" />
        <Text className={cn("flex-1 text-[12.5px] leading-[1.4] text-ink-2", body)}>
          {t("cadence.graceNote")}
        </Text>
      </View>

      <View className="flex-1" />

      <Button variant="vault" size="lg" className="h-[54px] rounded-2xl" onPress={onArm}>
        <Text className={cn("font-heading text-white", body)}>{t("cadence.cta")}</Text>
      </Button>
    </View>
  )
}
