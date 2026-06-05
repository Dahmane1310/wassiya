import { View } from "react-native"
import { Clock, ShieldCheck, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { IconBadge } from "@/components/ui/icon-badge"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useThemeColors } from "@/lib/colors"

/** Notifications feed (mock) opened from the Vault header bell. */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const items = [
    { icon: Clock, color: c.goldDeep, a: t("notif.dueA"), b: t("notif.dueB") },
    { icon: ShieldCheck, color: c.green, a: t("notif.shariaA"), b: t("notif.shariaB") },
    { icon: Users, color: c.primary, a: t("notif.execA"), b: t("notif.execB") },
  ]
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={t("notif.title")} subtitle={t("notif.recent")} onClose={onClose} />
      <View className="gap-2.5 px-5 pb-2 pt-2">
        {items.map((it, i) => (
          <View
            key={i}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
          >
            <IconBadge icon={it.icon} color={it.color} size={40} radius={11} />
            <View className="min-w-0 flex-1">
              <Text className="font-heading text-[14.5px] text-foreground">{it.a}</Text>
              <Text className="mt-0.5 font-sans-medium text-[12.5px] text-ink-3">{it.b}</Text>
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  )
}
