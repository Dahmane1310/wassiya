import type * as React from "react"
import { Pressable, View } from "react-native"
import { ChevronLeft } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/**
 * The large serif screen title used across the redesigned tabs (Assets, Heirs,
 * Wasiyyah, Profile). The parent `ScreenContainer` owns the status-bar inset, so
 * this only renders the title block + optional back/action. RTL-safe via flex-row.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const { display, body, tracking } = useBrandType()
  return (
    <View className="flex-row items-end justify-between gap-3 pb-2 pt-1">
      <View className="min-w-0 flex-1">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            className="mb-2 -ml-1 flex-row items-center gap-1 active:opacity-70"
          >
            <Icon as={ChevronLeft} size={18} className="text-primary" />
            <Text className="font-sans-semibold text-[15px] text-primary">
              {t("common.back")}
            </Text>
          </Pressable>
        ) : null}
        <Text className={cn("text-[32px] leading-[1.05] text-foreground", display, tracking)}>
          {title}
        </Text>
        {subtitle ? (
          <Text className={cn("mt-1.5 text-[14.5px] text-ink-2", body)}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
