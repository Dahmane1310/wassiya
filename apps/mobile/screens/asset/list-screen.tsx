import { SectionList, View } from "react-native"
import { router } from "expo-router"
import { Plus, Vault } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { VaultGlow } from "@/components/brand/vault-glow"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import {
  useDecryptedAssets,
  type DecryptedAsset,
} from "@/hooks/use-decrypted-assets"
import { AssetListItem } from "@/screens/asset/components/asset-list-item"
import { AssetListSkeleton } from "@/screens/asset/components/asset-list-skeleton"
import { AssetSectionHeader } from "@/screens/asset/components/asset-section-header"
import { EstateSummaryCard } from "@/screens/asset/components/estate-summary-card"
import { EstateSummarySkeleton } from "@/screens/asset/components/estate-summary-skeleton"

/** The unlocked Vault tab: an estate-value hero over the owner's encrypted
 *  assets, split into Assets and Debts. The whole list is decrypted once
 *  upstream so the hero can total it; each row still fails in isolation. The
 *  bar owns the bottom inset (top edge only). */
export function AssetListScreen() {
  const { t } = useTranslation()
  const { ar, body, display, tracking } = useBrandType()
  const { entries, summary, loading } = useDecryptedAssets()

  const header = (
    <View className="flex-row items-center justify-between pb-4 pt-2">
      <Text
        accessibilityRole="header"
        className={cn("text-2xl text-foreground", display, tracking)}
        maxFontSizeMultiplier={1.3}
      >
        {t("asset.list.title")}
      </Text>
      <Button
        size="sm"
        onPress={() => router.push("/vault/new")}
        accessibilityLabel={t("asset.list.add")}
      >
        <Icon as={Plus} className="text-primary-foreground" size={18} />
        <Text className={ar ? body : undefined}>{t("asset.list.add")}</Text>
      </Button>
    </View>
  )

  if (loading || entries === null) {
    return (
      <ScreenContainer edges={["top"]} background={<VaultGlow />}>
        {header}
        <View className="gap-6">
          <EstateSummarySkeleton />
          <AssetListSkeleton />
        </View>
      </ScreenContainer>
    )
  }

  if (entries.length === 0) {
    return (
      <ScreenContainer edges={["top"]} background={<VaultGlow />}>
        {header}
        <EmptyState
          icon={Vault}
          title={t("vault.emptyTitle")}
          body={t("vault.emptyBody")}
        />
      </ScreenContainer>
    )
  }

  const debts = entries.filter((e) => e.payload?.kind === "debt")
  const assets = entries.filter((e) => e.payload?.kind !== "debt")
  const sections = [
    assets.length
      ? { key: "assets", title: t("asset.section.assets"), data: assets }
      : null,
    debts.length
      ? { key: "debts", title: t("asset.section.debts"), data: debts }
      : null,
  ].filter((s): s is { key: string; title: string; data: DecryptedAsset[] } =>
    s !== null,
  )

  return (
    <ScreenContainer edges={["top"]} background={<VaultGlow />}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.row._id}
        ListHeaderComponent={
          <>
            {header}
            <EstateSummaryCard summary={summary} />
          </>
        }
        renderSectionHeader={({ section }) => (
          <AssetSectionHeader title={section.title} />
        )}
        renderItem={({ item }) => (
          <AssetListItem row={item.row} payload={item.payload} />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  )
}
