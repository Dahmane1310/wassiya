import { useState } from "react"
import { Pressable, View } from "react-native"
import { Eye, EyeOff } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

// A stable ciphertext-looking mask for a plaintext value (Unicode-safe — avoids
// btoa, which Hermes lacks and which throws on non-Latin1 chars). Decorative only.
function cipherOf(value: string) {
  const hex = Array.from(value)
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
  return "••••  " + (hex.slice(0, 14).toUpperCase() || "0000") + "  ••"
}

/** A secret detail shown as ciphertext until the eye is tapped (asset detail). */
export function EncField({ value, label }: { value: string; label?: string }) {
  const [show, setShow] = useState(false)
  return (
    <View className="flex-row items-center justify-between gap-2.5">
      <View className="min-w-0 flex-1">
        {label ? (
          <Text className="mb-0.5 font-sans-semibold text-[11.5px] uppercase tracking-wide text-ink-3">
            {label}
          </Text>
        ) : null}
        <Text
          numberOfLines={1}
          className={cn(
            "font-mono text-[13.5px]",
            show ? "text-foreground" : "tracking-wider text-ink-3"
          )}
        >
          {show ? value : cipherOf(value)}
        </Text>
      </View>
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={8}
        className="p-1.5 active:opacity-60"
      >
        <Icon as={show ? EyeOff : Eye} size={19} className="text-ink-3" />
      </Pressable>
    </View>
  )
}
