import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { IconBadge } from "@/components/ui/icon-badge"
import { SectionLabel } from "@/components/ui/section-label"
import { useThemeColors } from "@/lib/colors"
import { ACTIVITY } from "@/lib/mock-estate"

/** Recent vault activity feed (check-ins, encryptions, heir/Wasiyyah edits). */
export function ActivityList() {
  const { t } = useTranslation()
  const c = useThemeColors()
  return (
    <View>
      <SectionLabel>{t("vaultHome.recentActivity")}</SectionLabel>
      <View className="rounded-2xl border border-border bg-card px-1.5 py-0.5 shadow-sm shadow-black/5">
        {ACTIVITY.map((a, i) => (
          <View
            key={a.id}
            className={cn(
              "flex-row items-center gap-3 px-3 py-3",
              i < ACTIVITY.length - 1 && "border-b border-line-2"
            )}
          >
            <IconBadge icon={a.icon} color={c[a.color]} size={38} radius={11} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-semibold text-[14.5px] text-foreground">
                {a.text}
              </Text>
              <Text className="mt-0.5 font-sans-medium text-[12.5px] text-ink-3">
                {a.when}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
