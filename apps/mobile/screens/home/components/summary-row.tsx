import { View } from "react-native"
import { type LucideIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui-native/components/ui/badge"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** One row in the dashboard's "what's next" list: an icon + label + a muted
 *  "coming soon" pill. Reused for Assets / People / Check-in until each ships. */
export function SummaryRow({
  icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon as={icon} className="text-muted-foreground" size={18} />
      </View>
      <Text className={cn("flex-1 text-base text-foreground", body)}>
        {label}
      </Text>
      <Badge variant="secondary">
        <Text className={ar ? body : undefined}>{t("home.comingSoon")}</Text>
      </Badge>
    </View>
  )
}
