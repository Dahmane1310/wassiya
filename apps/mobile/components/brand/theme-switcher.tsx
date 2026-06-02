import { Pressable } from "react-native"
import { Moon, Sun } from "lucide-react-native"
import { useUniwind } from "uniwind"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"
import { setThemeMode } from "@/lib/theme"

/**
 * A compact light/dark toggle. The icon shows the mode you'll switch TO. Reads
 * the effective theme from Uniwind (resolves "system" to light/dark) and applies
 * the choice instantly — no reload.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme } = useUniwind()
  const isDark = theme === "dark"

  return (
    <Pressable
      onPress={() => void setThemeMode(isDark ? "light" : "dark")}
      accessibilityRole="button"
      accessibilityLabel={
        isDark ? "Switch to light theme" : "Switch to dark theme"
      }
      hitSlop={8}
      className={cn(
        "items-center justify-center rounded-full border border-border bg-card/60 p-2 active:opacity-70",
        className
      )}
    >
      <Icon
        as={isDark ? Sun : Moon}
        className="text-muted-foreground"
        size={16}
      />
    </Pressable>
  )
}
