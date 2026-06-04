import { View } from "react-native"
import { ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui-native/components/ui/card"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** The dashboard's hero: a reassuring "vault secured" card. Pure presentation —
 *  the live dead-man's-switch status lands here once the heartbeat is built. */
export function VaultStatusCard() {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()
  const titleFont = ar ? body : "font-sans-semibold"

  return (
    <Card>
      <CardContent className="flex-row items-start gap-4">
        <View className="bg-state-active/10 h-12 w-12 items-center justify-center rounded-full">
          <Icon as={ShieldCheck} className="text-state-active" size={26} />
        </View>
        <View className="flex-1 gap-1">
          <Text className={cn("text-base text-card-foreground", titleFont)}>
            {t("home.vaultSecured")}
          </Text>
          <Text
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              body
            )}
          >
            {t("home.vaultSecuredHint")}
          </Text>
        </View>
      </CardContent>
    </Card>
  )
}
