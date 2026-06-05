import { useCallback, useState } from "react"
import { Platform, View } from "react-native"
import * as Haptics from "expo-haptics"
import { Layers, Scale } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { VaultGlow } from "@/components/brand/vault-glow"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useSwitch } from "@/hooks/use-switch"
import { AddAssetSheet } from "@/screens/asset/components/add-asset-sheet"
import { NotificationsSheet } from "@/screens/flows/notifications-sheet"
import { ActivityList } from "@/screens/vault-home/components/activity-list"
import { DistributionSheet } from "@/screens/vault-home/components/distribution-sheet"
import { EstateSummaryCard } from "@/screens/vault-home/components/estate-summary-card"
import { HeartbeatHero } from "@/screens/vault-home/components/heartbeat-hero"
import { SetupChecklist } from "@/screens/vault-home/components/setup-checklist"
import { VaultGreeting } from "@/screens/vault-home/components/vault-greeting"

/**
 * The Vault tab — the heartbeat home. The dead-man's switch reframed as a calm,
 * living check-in, over the estate summary, finish-your-vault nudges, and recent
 * activity. Front-end mock data (no heartbeat backend yet); the Assets tab is the
 * one wired to Convex.
 */
export function VaultHomeScreen() {
  const { t } = useTranslation()
  const sw = useSwitch()
  const [justChecked, setJustChecked] = useState(false)
  const [showDistribution, setShowDistribution] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)

  const checkIn = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    // Optimistic animation; the real state arrives via the live query.
    setJustChecked(true)
    setTimeout(() => setJustChecked(false), 2600)
    void sw.checkIn().catch(() => {})
  }, [sw])

  return (
    <ScreenContainer scroll edges={["top"]} background={<VaultGlow />}>
      <View className="flex-1 gap-5 pb-28 pt-1">
        <VaultGreeting name="Yusuf" onBell={() => setShowNotifications(true)} />

        <HeartbeatHero
          status={sw.status}
          streak={sw.streak}
          nextDue={sw.nextDueDays}
          cadence={sw.cadenceDays}
          graceDays={sw.graceDays}
          justChecked={justChecked}
          onCheckIn={checkIn}
        />

        <EstateSummaryCard />

        <SetupChecklist />

        <View className="flex-row gap-2.5">
          <Button
            variant="vault"
            className="h-[52px] flex-1 rounded-2xl"
            onPress={() => setShowAddAsset(true)}
          >
            <Icon as={Layers} size={18} className="text-white" />
            <Text className="font-heading text-white">{t("vaultHome.addAsset")}</Text>
          </Button>
          <Button
            variant="outline"
            className="h-[52px] flex-1 rounded-2xl"
            onPress={() => setShowDistribution(true)}
          >
            <Icon as={Scale} size={18} className="text-foreground" />
            <Text className="font-heading text-foreground">{t("vaultHome.distribution")}</Text>
          </Button>
        </View>

        <ActivityList />
      </View>

      <DistributionSheet open={showDistribution} onClose={() => setShowDistribution(false)} />
      <NotificationsSheet open={showNotifications} onClose={() => setShowNotifications(false)} />
      <AddAssetSheet open={showAddAsset} onClose={() => setShowAddAsset(false)} />
    </ScreenContainer>
  )
}
