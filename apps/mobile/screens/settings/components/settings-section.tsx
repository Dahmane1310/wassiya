import { type ReactNode } from "react"
import { View } from "react-native"
import { Card } from "@workspace/ui-native/components/ui/card"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** A titled Settings group: an eyebrow title above a card that clips its rows.
 *  Rows + Separators are passed as children. */
export function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { ar, body } = useBrandType()
  // uppercase/tracking suit the Latin eyebrow; Arabic has no case and tracking
  // breaks cursive joins, so route Arabic through the plain body font.
  const titleClass = ar ? body : "font-sans-medium uppercase tracking-wide"

  return (
    <View className="gap-2">
      <Text className={cn("px-1 text-xs text-muted-foreground", titleClass)}>
        {title}
      </Text>
      <Card className="gap-0 overflow-hidden py-0">{children}</Card>
    </View>
  )
}
