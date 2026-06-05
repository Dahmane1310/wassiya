import { View } from "react-native"
import { Activity, Bell, Clock, Phone } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { ProfileGroup } from "@/screens/settings/components/profile-group"
import { ProfileRow } from "@/screens/settings/components/profile-row"
import { useThemeColors } from "@/lib/colors"
import { HEARTBEAT } from "@/lib/mock-estate"

/** Dead-man's-switch config + executors. Mock data (no switch backend yet). */
export function SwitchSection() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const execs = HEARTBEAT.executors
  return (
    <>
      <ProfileGroup title={t("profile.switchTitle")}>
        <ProfileRow icon={Activity} color={c.green} title={t("profile.cadence")} detail={t("profile.cadenceValue")} onPress={() => {}} />
        <ProfileRow icon={Clock} color={c.goldDeep} title={t("profile.grace")} detail={t("profile.graceValue")} onPress={() => {}} />
        <ProfileRow icon={Bell} color={c.primary} title={t("profile.reminders")} detail={t("profile.remindersValue")} onPress={() => {}} last />
      </ProfileGroup>

      <ProfileGroup
        title={t("profile.executors")}
        right={
          <Text className="font-heading text-[13px] text-primary">{t("profile.add")}</Text>
        }
      >
        {execs.map((e, i) => (
          <View
            key={e.id}
            className={cn(
              "flex-row items-center gap-3 px-3.5 py-3",
              i < execs.length - 1 && "border-b border-line-2"
            )}
          >
            <View
              style={{ backgroundColor: (i === 0 ? c.primary : c.goldDeep) + "29" }}
              className="h-[42px] w-[42px] items-center justify-center rounded-full"
            >
              <Text className="font-heading text-[13px]" style={{ color: i === 0 ? c.primary : c.goldDeep }}>
                {e.initials}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-heading text-[15px] text-foreground">{e.name}</Text>
              <Text className="font-sans-medium text-[12.5px] text-ink-3">
                {e.role} · {e.phone}
              </Text>
            </View>
            <Phone size={18} color={c.ink3} strokeWidth={1.9} />
          </View>
        ))}
      </ProfileGroup>
    </>
  )
}
