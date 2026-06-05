import type * as React from "react"
import { View } from "react-native"
import { SectionLabel } from "@/components/ui/section-label"

/** A titled group of ProfileRows inside one rounded card. */
export function ProfileGroup({
  title,
  right,
  children,
}: {
  title?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <View>
      {title ? <SectionLabel right={right}>{title}</SectionLabel> : null}
      <View className="overflow-hidden rounded-2xl border border-border bg-card px-1.5 shadow-sm shadow-black/5">
        {children}
      </View>
    </View>
  )
}
