import { View } from "react-native"
import { Crown, ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { LinearGradient } from "expo-linear-gradient"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"

/** Owner identity card — name, email, plan + zero-knowledge badges, over a soft
 *  bronze wash. Placeholder content until wired to the WorkOS profile. */
export function IdentityCard() {
  const { t } = useTranslation()
  const { display } = useBrandType()
  const c = useThemeColors()
  return (
    <View className="overflow-hidden rounded-[28px] border border-border shadow-md shadow-black/5">
      <LinearGradient
        colors={[c.gold + "26", c.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center gap-3.5">
          <View
            className="h-[60px] w-[60px] items-center justify-center rounded-full border-2"
            style={{ backgroundColor: c.gold + "24", borderColor: c.gold }}
          >
            <Text className="font-heading text-[21px] text-gold-deep">YA</Text>
          </View>
          <View className="flex-1">
            <Text className={cn("text-[22px] text-foreground", display)}>Yusuf Al Marri</Text>
            <Text className="font-sans-medium text-[13px] text-ink-3">yusuf@almarri.ae</Text>
          </View>
        </View>
        <View className="mt-4 flex-row gap-2">
          <View className="h-[38px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-gold-soft">
            <Crown size={15} color={c.goldDeep} strokeWidth={2} />
            <Text className="font-heading text-[12.5px] text-gold-deep">{t("profile.plan")}</Text>
          </View>
          <View className="h-[38px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-green-soft">
            <ShieldCheck size={15} color={c.green} strokeWidth={2} />
            <Text className="font-heading text-[12.5px] text-green">{t("profile.zeroKnowledge")}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}
