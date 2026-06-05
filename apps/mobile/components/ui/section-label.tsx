import type * as React from "react"
import { View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** Uppercase section header with an optional trailing node (count / action / pill). */
export function SectionLabel({
  children,
  right,
  className,
}: {
  children: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  const { ar, body } = useBrandType()
  return (
    <View
      className={cn(
        "flex-row items-center justify-between px-1 pb-2.5 pt-0.5",
        className
      )}
    >
      <Text
        className={cn(
          "text-xs text-ink-3",
          // Arabic has no caps and tracking breaks cursive joins.
          ar ? body : "font-sans-semibold uppercase tracking-wide"
        )}
      >
        {children}
      </Text>
      {right}
    </View>
  )
}
