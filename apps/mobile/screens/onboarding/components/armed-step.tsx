import { View } from "react-native"
import Animated from "react-native-reanimated"
import { ArrowRight, ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"
import { usePop } from "@/lib/motion"

/** The closing "your vault is armed" moment — a popped shield + a single CTA into
 *  the vault. The reassuring end of the onboarding heartbeat. */
export function ArmedStep({ onEnter }: { onEnter: () => void }) {
  const { t } = useTranslation()
  const { display, body } = useBrandType()
  const c = useThemeColors()
  const pop = usePop(true)

  return (
    <View className="flex-1 items-center justify-center gap-3 px-2 pb-6">
      <Animated.View
        style={pop}
        className="mb-2 h-[120px] w-[120px] items-center justify-center rounded-full bg-green-soft"
      >
        <ShieldCheck size={58} color={c.green} strokeWidth={1.8} />
      </Animated.View>
      <Text className={cn("text-center text-[32px] text-foreground", display)}>
        {t("armed.title")}
      </Text>
      <Text className={cn("px-4 text-center text-[15px] leading-relaxed text-ink-2", body)}>
        {t("armed.body")}
      </Text>
      <View className="h-2" />
      <Button variant="vault" size="lg" className="h-[54px] w-full rounded-2xl" onPress={onEnter}>
        <Text className={cn("font-heading text-white", body)}>{t("armed.cta")}</Text>
        <Icon as={ArrowRight} size={19} className="text-white" />
      </Button>
    </View>
  )
}
