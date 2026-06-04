import { type ReactNode } from "react"
import { Pressable, View } from "react-native"
import { type LucideIcon } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

type SettingsRowProps = {
  icon: LucideIcon
  label: string
  /** Optional secondary line under the label. */
  description?: string
  /** A trailing control (e.g. a switcher). When set, the row is not pressable. */
  right?: ReactNode
  /** Makes the whole row a button. Omit when `right` owns the interaction. */
  onPress?: () => void
  /** Red tint for irreversible/dangerous actions (e.g. sign out). */
  destructive?: boolean
  disabled?: boolean
}

/** One Settings list row: leading icon + label (+ description), optional trailing
 *  control. Becomes a Pressable only when `onPress` is given. */
export function SettingsRow({
  icon,
  label,
  description,
  right,
  onPress,
  destructive,
  disabled,
}: SettingsRowProps) {
  const { ar, body } = useBrandType()
  const Container = onPress ? Pressable : View
  const tone = destructive ? "text-danger" : "text-foreground"
  const iconTone = destructive ? "text-danger" : "text-muted-foreground"

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
      className={cn(
        "flex-row items-center gap-3 px-4 py-3.5",
        onPress && "active:bg-muted/50",
        disabled && "opacity-50"
      )}
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon as={icon} className={iconTone} size={18} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={cn("text-base", tone, body)}>{label}</Text>
        {description ? (
          <Text className={cn("text-xs text-muted-foreground", body)}>
            {description}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </Container>
  )
}
