import { View } from "react-native"
import { KeyRound, Lock, ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { IconBadge } from "@/components/ui/icon-badge"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useThemeColors } from "@/lib/colors"

/** "How your privacy works" — the one place the security story is spelled out, so
 *  the rest of the app stays plain. Reassurance first; the technical specifics sit
 *  in the muted footer for the curious. */
export function PrivacyExplainerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const points = [
    { icon: Lock, title: t("privacy.p1Title"), body: t("privacy.p1Body") },
    { icon: ShieldCheck, title: t("privacy.p2Title"), body: t("privacy.p2Body") },
    { icon: KeyRound, title: t("privacy.p3Title"), body: t("privacy.p3Body") },
  ]
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={t("privacy.title")} subtitle={t("privacy.intro")} onClose={onClose} />
      <View className="gap-4 px-5 pb-5 pt-1">
        {points.map((p) => (
          <View key={p.title} className="flex-row items-start gap-3.5">
            <IconBadge icon={p.icon} color={c.primary} size={40} radius={12} />
            <View className="flex-1">
              <Text className="font-heading text-[14.5px] text-foreground">{p.title}</Text>
              <Text className="mt-0.5 font-sans-medium text-[12.5px] leading-[1.45] text-ink-3">{p.body}</Text>
            </View>
          </View>
        ))}
        <Text className="font-sans-medium text-[11.5px] leading-[1.5] text-ink-3">{t("privacy.tech")}</Text>
        <Button variant="gold" className="mt-1 h-[52px] rounded-2xl" onPress={onClose}>
          <Text className="font-heading text-white">{t("privacy.gotIt")}</Text>
        </Button>
      </View>
    </Sheet>
  )
}
