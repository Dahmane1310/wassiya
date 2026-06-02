import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

type WordmarkSize = "sm" | "md" | "lg"

type WordmarkProps = {
  size?: WordmarkSize
  className?: string
}

const SIZE: Record<WordmarkSize, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
}

/**
 * The localized "Wassiya" / "وصية" logotype — heavy display face per language
 * (Fraunces / Tajawal). Rendered as accessible text so it stays crisp.
 */
export function Wordmark({ size = "lg", className }: WordmarkProps) {
  const { t } = useTranslation()
  const { displayBold, tracking } = useBrandType()
  return (
    <Text
      accessibilityRole="header"
      className={cn(
        displayBold,
        tracking,
        "text-foreground",
        SIZE[size],
        className
      )}
    >
      {t("brand.name")}
    </Text>
  )
}
