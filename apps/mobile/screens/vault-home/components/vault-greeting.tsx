import { Pressable, useColorScheme, View } from "react-native"
import { Bell, Moon, Sun } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { setThemeMode } from "@/lib/theme"

/** Header for the Vault home: salam greeting + quick theme toggle + notifications. */
export function VaultGreeting({
  name,
  onBell,
}: {
  name: string
  onBell: () => void
}) {
  const { t } = useTranslation()
  const { display, tracking } = useBrandType()
  const isDark = useColorScheme() === "dark"

  return (
    <View className="flex-row items-center justify-between">
      <View className="min-w-0 flex-1">
        <Text className="font-sans-medium text-[14px] text-ink-2">
          {t("vaultHome.greetingKicker")}
        </Text>
        <Text className={cn("mt-0.5 text-[26px] text-foreground", display, tracking)}>
          {t("vaultHome.greeting", { name })}
        </Text>
      </View>
      <View className="flex-row gap-2.5">
        <RoundButton
          icon={isDark ? Sun : Moon}
          onPress={() => void setThemeMode(isDark ? "light" : "dark")}
          label={t("vaultHome.toggleTheme")}
        />
        <RoundButton icon={Bell} onPress={onBell} label={t("vaultHome.notifications")} dot />
      </View>
    </View>
  )
}

function RoundButton({
  icon,
  onPress,
  label,
  dot = false,
}: {
  icon: Parameters<typeof Icon>[0]["as"]
  onPress: () => void
  label: string
  dot?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      className="h-[46px] w-[46px] items-center justify-center rounded-full border border-border bg-card shadow-sm shadow-black/5 active:opacity-70"
    >
      <Icon as={icon} size={20} className="text-foreground" />
      {dot ? (
        <View className="absolute right-3 top-3 h-2 w-2 rounded-full border-[1.5px] border-card bg-gold" />
      ) : null}
    </Pressable>
  )
}
