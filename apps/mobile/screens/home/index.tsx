import { View } from "react-native"
import { CalendarCheck, Users, Vault } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui-native/components/ui/card"
import { Separator } from "@workspace/ui-native/components/ui/separator"
import { VaultGlow } from "@/components/brand/vault-glow"
import { ScreenContainer } from "@/components/layout/screen-container"
import { SummaryRow } from "@/screens/home/components/summary-row"
import { HomeHeader } from "@/screens/home/components/home-header"
import { VaultStatusCard } from "@/screens/home/components/vault-status-card"

/** The Home tab: the authenticated dashboard. A greeting, a reassuring vault
 *  status card, and a preview list of the capabilities arriving next. The bar
 *  owns the bottom inset, so this screen insets only the top. */
export function HomeScreen() {
  const { t } = useTranslation()

  return (
    <ScreenContainer scroll edges={["top"]} background={<VaultGlow />}>
      <View className="flex-1 gap-7 pt-1 pb-8">
        <HomeHeader />
        <VaultStatusCard />
        <Card>
          <CardContent className="gap-0">
            <SummaryRow icon={Vault} label={t("home.assets")} />
            <Separator />
            <SummaryRow icon={Users} label={t("home.people")} />
            <Separator />
            <SummaryRow icon={CalendarCheck} label={t("home.checkIn")} />
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  )
}
