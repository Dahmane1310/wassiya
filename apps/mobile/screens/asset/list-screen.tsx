import { useState } from "react"
import { Pressable, SectionList, View } from "react-native"
import { Plus, Vault } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { VaultGlow } from "@/components/brand/vault-glow"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"
import { ScreenHeader } from "@/components/ui/screen-header"
import {
  useDecryptedAssets,
  type DecryptedAsset,
} from "@/hooks/use-decrypted-assets"
import { AddAssetSheet } from "@/screens/asset/components/add-asset-sheet"
import { AssetListItem } from "@/screens/asset/components/asset-list-item"
import { AssetListSkeleton } from "@/screens/asset/components/asset-list-skeleton"
import { AssetSectionHeader } from "@/screens/asset/components/asset-section-header"
import { EstateSummaryCard } from "@/screens/asset/components/estate-summary-card"
import { EstateSummarySkeleton } from "@/screens/asset/components/estate-summary-skeleton"

/** The unlocked Vault tab: an estate-value hero over the owner's encrypted
 *  assets, split into Assets and Debts. The whole list is decrypted once
 *  upstream so the hero can total it; each row still fails in isolation. The
 *  bar owns the bottom inset (top edge only). Create opens a bottom sheet. */
export function AssetListScreen() {
  const { t } = useTranslation()
  const { entries, summary, loading } = useDecryptedAssets()
  const [showAdd, setShowAdd] = useState(false)

  const count = entries?.length ?? 0
  const header = (
    <View className="pb-4 pt-1">
      <ScreenHeader
        title={t("asset.list.title")}
        subtitle={t("asset.list.subtitle", { count })}
        action={
          <Pressable
            onPress={() => setShowAdd(true)}
            accessibilityLabel={t("asset.list.add")}
            className="h-[46px] w-[46px] items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30 active:opacity-80"
          >
            <Icon as={Plus} className="text-primary-foreground" size={24} />
          </Pressable>
        }
      />
    </View>
  )
  const sheet = <AddAssetSheet open={showAdd} onClose={() => setShowAdd(false)} />

  if (loading || entries === null) {
    return (
      <ScreenContainer edges={["top"]} background={<VaultGlow />}>
        {header}
        <View className="gap-6">
          <EstateSummarySkeleton />
          <AssetListSkeleton />
        </View>
        {sheet}
      </ScreenContainer>
    )
  }

  if (entries.length === 0) {
    return (
      <ScreenContainer edges={["top"]} background={<VaultGlow />}>
        {header}
        <EmptyState icon={Vault} title={t("vault.emptyTitle")} body={t("vault.emptyBody")} />
        {sheet}
      </ScreenContainer>
    )
  }

  const debts = entries.filter((e) => e.payload?.kind === "debt")
  const assets = entries.filter((e) => e.payload?.kind !== "debt")
  const sections = [
    assets.length ? { key: "assets", title: t("asset.section.assets"), data: assets } : null,
    debts.length ? { key: "debts", title: t("asset.section.debts"), data: debts } : null,
  ].filter((s): s is { key: string; title: string; data: DecryptedAsset[] } => s !== null)

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
        renderSectionHeader={({ section }) => <AssetSectionHeader title={section.title} />}
        renderItem={({ item }) => <AssetListItem row={item.row} payload={item.payload} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      />
      {sheet}
    </ScreenContainer>
  )
}
