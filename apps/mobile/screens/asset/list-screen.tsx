import { useState } from "react"
import { Pressable, SectionList, View } from "react-native"
import { Plus, Vault } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"
import { ScreenHeader } from "@/components/ui/screen-header"
import {
  useDecryptedAssets,
  type DecryptedAsset,
} from "@/hooks/use-decrypted-assets"
import { useEntitlement } from "@/hooks/use-entitlement"
import { useKeyReconciliation } from "@/hooks/use-key-reconciliation"
import { usePaywallStore } from "@/stores/paywall"
import { AddAssetSheet } from "@/screens/asset/components/add-asset-sheet"
import { AssetListItem } from "@/screens/asset/components/asset-list-item"
import { AssetListSkeleton } from "@/screens/asset/components/asset-list-skeleton"
import { AssetSectionHeader } from "@/screens/asset/components/asset-section-header"
import { EditAssetSheet } from "@/screens/asset/components/edit-asset-sheet"
import { EstateSummaryCard } from "@/screens/asset/components/estate-summary-card"
import { EstateSummarySkeleton } from "@/screens/asset/components/estate-summary-skeleton"

/** The unlocked Vault tab: an estate-value hero over the owner's encrypted
 *  assets, split into Assets and Debts. The whole list is decrypted once
 *  upstream so the hero can total it; each row still fails in isolation. Create
 *  opens a bottom sheet; tapping a row opens the edit sheet. The ScreenContainer +
 *  sheets render once (only the inner content swaps) so the sheets never remount. */
export function AssetListScreen() {
  const { t } = useTranslation()
  const { entries, summary, loading } = useDecryptedAssets()
  const ent = useEntitlement()
  // Wrap DEKs to enrolled beneficiaries while the vault is unlocked (the release
  // envelope). Dormant until a beneficiary has an enrolled public key.
  useKeyReconciliation()
  const showPaywall = usePaywallStore((s) => s.show)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<Id<"assets"> | null>(null)

  // Proactive gate: an expired trial opens the paywall instead of the add sheet.
  const onAdd = () => (ent.isExpired ? showPaywall() : setShowAdd(true))

  const count = entries?.length ?? 0
  const header = (
    <View className="pb-4 pt-1">
      <ScreenHeader
        title={t("asset.list.title")}
        subtitle={t("asset.list.subtitle", { count })}
        action={
          <Pressable
            onPress={onAdd}
            accessibilityLabel={t("asset.list.add")}
            className="h-[46px] w-[46px] items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30 active:opacity-80"
          >
            <Icon as={Plus} className="text-primary-foreground" size={24} />
          </Pressable>
        }
      />
    </View>
  )

  function renderContent() {
    if (loading || entries === null) {
      return (
        <View>
          {header}
          <View className="gap-6">
            <EstateSummarySkeleton />
            <AssetListSkeleton />
          </View>
        </View>
      )
    }

    if (entries.length === 0) {
      return (
        <View>
          {header}
          <EmptyState icon={Vault} title={t("vault.emptyTitle")} body={t("vault.emptyBody")} />
        </View>
      )
    }

    const debts = entries.filter((e) => e.payload?.kind === "debt")
    const assets = entries.filter((e) => e.payload?.kind !== "debt")
    const sections = [
      assets.length ? { key: "assets", title: t("asset.section.assets"), data: assets } : null,
      debts.length ? { key: "debts", title: t("asset.section.debts"), data: debts } : null,
    ].filter((s): s is { key: string; title: string; data: DecryptedAsset[] } => s !== null)

    return (
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
        renderItem={({ item }) => (
          <AssetListItem
            row={item.row}
            payload={item.payload}
            onPress={() => setEditingId(item.row._id as Id<"assets">)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      />
    )
  }

  return (
    <ScreenContainer edges={["top"]}>
      {renderContent()}
      <AddAssetSheet open={showAdd} onClose={() => setShowAdd(false)} />
      <EditAssetSheet
        open={editingId !== null}
        assetId={editingId}
        onClose={() => setEditingId(null)}
      />
    </ScreenContainer>
  )
}
