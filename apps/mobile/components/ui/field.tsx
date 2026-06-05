import type * as React from "react"
import { View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

/**
 * The app's canonical labelled input box: a bold-ish caption over a bordered,
 * rounded-2xl card-coloured container. Used by every form (assets, contacts,
 * heirs…) so a TextInput looks identical everywhere. Pass `tall` for multiline.
 */
export function Field({
  label,
  tall = false,
  children,
}: {
  label: string
  tall?: boolean
  children: React.ReactNode
}) {
  return (
    <View className="mb-3.5">
      <Text className="mb-2 font-sans-semibold text-[12.5px] text-ink-2">{label}</Text>
      <View
        className={cn(
          "flex-row gap-2 rounded-2xl border border-border bg-card px-3.5",
          tall ? "h-24 items-start" : "h-[52px] items-center"
        )}
      >
        {children}
      </View>
    </View>
  )
}
