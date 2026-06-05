import type * as React from "react"
import { useEffect, useRef } from "react"
import { ScrollView, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useThemeColors } from "@/lib/colors"

/**
 * Bottom-sheet modal used by every flow (add asset, asset detail, distribution,
 * notifications, add heir). Built on @lodev09/react-native-true-sheet — a NATIVE
 * sheet (UISheetPresentationController on iOS, native Material sheet on Android):
 * real swipe-to-dismiss, native grabber + scrim.
 *
 * Sizing: by default the sheet renders content in a plain View and uses the `auto`
 * detent, so it hugs the content height (no dead white space). Pass `scroll` for a
 * sheet whose content can exceed the screen (e.g. Distribution) — that switches to
 * a scrollable container that can be dragged to full height.
 *
 * The declarative `open`/`onClose` API drives present()/dismiss() via the ref, so
 * callers stay unchanged. `dark` renders the warm-espresso vault panel. true-sheet
 * is a native module — needs a dev-client rebuild.
 */
export function Sheet({
  open,
  onClose,
  children,
  dark = false,
  scroll = false,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  dark?: boolean
  scroll?: boolean
}) {
  const ref = useRef<TrueSheet>(null)
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const c = useThemeColors()
  const padBottom = Math.max(insets.bottom, 16)

  useEffect(() => {
    if (open) void ref.current?.present().catch(() => {})
    else void ref.current?.dismiss().catch(() => {})
  }, [open])

  return (
    <TrueSheet
      ref={ref}
      // 'auto' hugs the content; the extra full detent only matters for `scroll`.
      detents={scroll ? ["auto", 1] : ["auto"]}
      maxContentHeight={height * 0.92}
      cornerRadius={30}
      grabber
      scrollable={scroll}
      backgroundColor={dark ? c.vault2 : c.background}
      onDidDismiss={onClose}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: padBottom }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ paddingBottom: padBottom }}>{children}</View>
      )}
    </TrueSheet>
  )
}
