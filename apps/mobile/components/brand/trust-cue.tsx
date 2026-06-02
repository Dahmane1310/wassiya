import { View } from "react-native"
import type { LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

type TrustCueProps = {
  icon: LucideIcon
  label: string
  className?: string
}

/**
 * A single trust signal: a teal icon + a short label. Uses gap (not margins) so
 * the row mirrors cleanly under RTL.
 */
export function TrustCue({ icon, label, className }: TrustCueProps) {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <Icon as={icon} className="text-primary" size={20} />
      <Text className="flex-1">{label}</Text>
    </View>
  )
}
