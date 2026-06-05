import { useState } from "react"
import { Pressable, TextInput, View } from "react-native"
import { Eye, EyeOff, Key } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { useThemeColors } from "@/lib/colors"

/** A design-language passphrase input: a key-iconed rounded field with an inline
 *  show/hide toggle. Shared by the onboarding (create) and unlock (enter) prompts. */
export function PassphraseField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  autoFocus = false,
  newPassword = false,
  onSubmitEditing,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  accessibilityLabel?: string
  autoFocus?: boolean
  /** New vault passphrase (create) vs an existing one (unlock) — drives autofill. */
  newPassword?: boolean
  onSubmitEditing?: () => void
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const [show, setShow] = useState(false)
  return (
    <View className="h-14 flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4">
      <Icon as={Key} size={20} className="text-ink-3" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={newPassword ? "newPassword" : "password"}
        placeholder={placeholder}
        placeholderTextColor={c.ink3}
        accessibilityLabel={accessibilityLabel}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? "go" : "default"}
        className="h-full flex-1 font-sans text-[16px] text-foreground"
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t(show ? "onboarding.hide" : "onboarding.show")}
        className="h-10 w-9 items-center justify-center active:opacity-60"
      >
        <Icon as={show ? EyeOff : Eye} size={19} className="text-ink-3" />
      </Pressable>
    </View>
  )
}
