import { View } from "react-native"
import { Info, ScrollText } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Pill } from "@/components/ui/pill"
import { useBrandType } from "@/hooks/use-brand-type"
import { cn } from "@workspace/ui-native/lib/utils"

/** The scriptural explainer for the one-third bequest cap. */
export function OneThirdRule() {
  const { t } = useTranslation()
  const { display } = useBrandType()
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-gold-soft p-[18px]">
      <View className="absolute -right-5 -top-7 opacity-10">
        <ScrollText size={120} color="#a26d33" />
      </View>
      <Pill tone="gold" icon={Info}>
        {t("wasiyyah.ruleTag")}
      </Pill>
      <Text className={cn("mt-3 text-[18px] leading-[1.4] text-gold-deep", display)}>
        {t("wasiyyah.ruleQuote")}
      </Text>
      <Text className="mt-2 font-sans-medium text-[12.5px] leading-[1.5] text-ink-2">
        {t("wasiyyah.ruleBody")}
      </Text>
    </View>
  )
}
