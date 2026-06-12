import { useRef, useState } from "react"
import { I18nManager, Pressable, TextInput, View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

type CodeBoxesProps = {
  value: string
  onChange: (next: string) => void
  length?: number
  accessibilityLabel: string
}

/** Segmented one-time-code entry: six framed digit boxes driven by a single
 *  hidden TextInput, with the active box highlighted in bronze. */
export function CodeBoxes({
  value,
  onChange,
  length = 6,
  accessibilityLabel,
}: CodeBoxesProps) {
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      className="self-stretch"
    >
      {/* Digits read left-to-right even in Arabic; RN mirrors flex rows under
          RTL, so flip the direction back explicitly. */}
      <View
        className="justify-center gap-2.5"
        style={{ flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }}
      >
        {Array.from({ length }, (_, i) => {
          const active = focused && i === value.length && value.length < length
          return (
            <View
              key={i}
              className={cn(
                "h-[58px] w-[46px] items-center justify-center rounded-2xl border bg-card",
                active ? "border-primary" : "border-border"
              )}
            >
              <Text className="font-mono text-[22px] text-foreground">
                {value[i] ?? ""}
              </Text>
            </View>
          )
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus
        caretHidden
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  )
}
