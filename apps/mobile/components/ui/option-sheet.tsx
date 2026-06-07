import { Pressable, View } from "react-native"
import { Check } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useBrandType } from "@/hooks/use-brand-type"

export type OptionItem = {
  /** Stable value passed back to `onSelect`. */
  key: string
  label: string
  /** Optional secondary line under the label. */
  description?: string
  /** Per-option font override (e.g. Arabic labels must render in Tajawal even
   *  while the app is still in English). Falls back to the active body font. */
  labelClassName?: string
}

/**
 * Single-select bottom sheet: a titled list of options, each a tappable row with a
 * check on the current value. Built on the shared native `Sheet`, so it inherits
 * swipe-to-dismiss, the grabber and content-hugging height. Selecting calls
 * `onSelect` and the caller decides whether to close (most do, immediately).
 */
export function OptionSheet({
  open,
  onClose,
  title,
  subtitle,
  options,
  selectedKey,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  options: OptionItem[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  const { ar, body } = useBrandType()
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
      <View className="px-5 pb-2 pt-2">
        <View className="overflow-hidden rounded-2xl border border-border bg-card px-1.5">
          {options.map((o, i) => {
            const on = o.key === selectedKey
            return (
              <Pressable
                key={o.key}
                onPress={() => onSelect(o.key)}
                className={cn(
                  "flex-row items-center gap-3 px-3 py-3.5 active:opacity-70",
                  i < options.length - 1 && "border-b border-line-2"
                )}
              >
                <View className="min-w-0 flex-1">
                  <Text
                    className={cn(
                      "text-[15.5px] text-foreground",
                      o.labelClassName ?? (ar ? body : "font-sans-semibold")
                    )}
                  >
                    {o.label}
                  </Text>
                  {o.description ? (
                    <Text className={cn("mt-0.5 text-[12.5px] text-ink-3", body)}>
                      {o.description}
                    </Text>
                  ) : null}
                </View>
                {on ? (
                  <View className="h-[26px] w-[26px] items-center justify-center rounded-full bg-primary">
                    <Icon as={Check} size={15} className="text-white" />
                  </View>
                ) : (
                  <View className="h-[26px] w-[26px] rounded-full border border-line" />
                )}
              </Pressable>
            )
          })}
        </View>
      </View>
    </Sheet>
  )
}
