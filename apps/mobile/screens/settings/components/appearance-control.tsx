import { Pressable, useColorScheme, View } from "react-native"
import { Moon, Sun } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useThemeColors } from "@/lib/colors"
import { setThemeMode, type ThemeMode } from "@/lib/theme"

/** Appearance row: icon + label + a Light/Dark segmented control wired to the
 *  existing theme store (instant, persisted). */
export function AppearanceControl() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const isDark = useColorScheme() === "dark"
  const current: ThemeMode = isDark ? "dark" : "light"

  const options: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: t("profile.light") },
    { key: "dark", icon: Moon, label: t("profile.dark") },
  ]

  return (
    <View className="flex-row items-center gap-3 px-3.5 py-3">
      <View
        style={{ backgroundColor: c.primary + "1f" }}
        className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
      >
        <Icon as={isDark ? Moon : Sun} size={18} className="text-primary" />
      </View>
      <Text className="flex-1 font-sans-semibold text-[15px] text-foreground">
        {t("profile.theme")}
      </Text>
      <View className="flex-row gap-1 rounded-xl bg-surface-3 p-1">
        {options.map((o) => {
          const on = current === o.key
          return (
            <Pressable
              key={o.key}
              onPress={() => void setThemeMode(o.key)}
              className={cn(
                "h-[34px] flex-row items-center gap-1.5 rounded-lg px-3.5 active:opacity-80",
                on && "bg-card shadow-sm shadow-black/5"
              )}
            >
              <Icon as={o.icon} size={15} className={on ? "text-foreground" : "text-ink-3"} />
              <Text
                className={cn(
                  "font-heading text-[13.5px]",
                  on ? "text-foreground" : "text-ink-3"
                )}
              >
                {o.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
