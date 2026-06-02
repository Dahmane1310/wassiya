import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { cn } from "@workspace/ui-native/lib/utils"

type Edge = "top" | "bottom" | "left" | "right"

type ScreenContainerProps = {
  children: React.ReactNode
  /** Render content inside a vertical ScrollView (for tall / dynamic-type-at-risk layouts). */
  scroll?: boolean
  /** Safe-area edges to inset as padding. Defaults to top + bottom. */
  edges?: readonly Edge[]
  /** Full-bleed atmospheric layer rendered behind the content (e.g. a gradient/glow). */
  background?: React.ReactNode
  /** Classes for the outer background surface (paints edge-to-edge). */
  className?: string
  /** Classes for the inner content wrapper / scroll content container. */
  contentClassName?: string
}

/**
 * The base screen primitive every Wassiya screen reuses: a `bg-background`
 * surface that paints edge-to-edge (including behind the status bar) with
 * safe-area insets applied as padding. An optional `background` node is layered
 * full-bleed behind the content for atmosphere.
 */
export function ScreenContainer({
  children,
  scroll = false,
  edges = ["top", "bottom"],
  background,
  className,
  contentClassName,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets()

  // Only include requested edges so unset (0) values can't override the px-6
  // horizontal padding on the same element.
  const inset: {
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
  } = {}
  if (edges.includes("top")) inset.paddingTop = insets.top
  if (edges.includes("bottom")) inset.paddingBottom = insets.bottom
  if (edges.includes("left")) inset.paddingLeft = insets.left
  if (edges.includes("right")) inset.paddingRight = insets.right

  const backgroundLayer = background ? (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {background}
    </View>
  ) : null

  if (scroll) {
    return (
      <View className={cn("flex-1 bg-background", className)}>
        {backgroundLayer}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={inset}
          contentContainerClassName={cn("grow px-6", contentClassName)}
        >
          {children}
        </ScrollView>
      </View>
    )
  }

  return (
    <View className={cn("flex-1 bg-background", className)} style={inset}>
      {backgroundLayer}
      <View className={cn("flex-1 px-6", contentClassName)}>{children}</View>
    </View>
  )
}
