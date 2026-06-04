import { useMemo } from "react"
import { Pressable, View } from "react-native"
import { type BottomTabBarProps } from "expo-router/js-tabs"
import { House, Settings, Users, Vault } from "lucide-react-native"
import { type LucideIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

// Fixed brand order for the bar. File order is alphabetical (home, people,
// settings, vault), so we sort the navigator's routes into this order instead.
const TAB_ORDER = ["home", "vault", "people", "settings"]
const TAB_ICONS: Record<string, LucideIcon> = {
  home: House,
  vault: Vault,
  people: Users,
  settings: Settings,
}

/**
 * Custom bottom tab bar. Built from Uniwind className tokens (not React
 * Navigation `screenOptions` colors, which evaluate once) so it re-resolves
 * instantly on a theme toggle, and from `flex-row` so it auto-mirrors under RTL.
 * The bar owns the bottom safe-area inset — tab screens use `edges={["top"]}`.
 */
export function VaultTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const activeKey = state.routes[state.index]?.key

  const routes = useMemo(
    () =>
      [...state.routes].sort(
        (a, b) => TAB_ORDER.indexOf(a.name) - TAB_ORDER.indexOf(b.name)
      ),
    [state.routes]
  )

  return (
    <View
      className="flex-row border-t border-border bg-card"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {routes.map((route) => {
        const isActive = route.key === activeKey
        const options = descriptors[route.key]?.options
        const label = t(`tabs.${route.name}`)
        const tone = isActive ? "text-primary" : "text-muted-foreground"
        const TabIcon = TAB_ICONS[route.name]

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
            hitSlop={8}
            className="flex-1 items-center justify-center gap-1 pt-2.5 active:opacity-70"
          >
            {TabIcon ? <Icon as={TabIcon} className={tone} size={22} /> : null}
            <Text className={cn("text-xs", tone, body)}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
