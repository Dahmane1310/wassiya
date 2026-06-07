import { Alert, View } from "react-native"
import { Trash2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useAssets } from "@/hooks/use-assets"
import { AssetForm } from "@/screens/asset/components/asset-form"

/** Edit an existing asset in a bottom sheet (tapping a row opens this instead of a
 *  detail page). Reuses the shared `AssetForm` in edit mode; delete confirms via a
 *  native alert (reliable above the native sheet) and closes on success. */
export function EditAssetSheet({
  open,
  assetId,
  onClose,
}: {
  open: boolean
  assetId: Id<"assets"> | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { remove } = useAssets()

  function confirmDelete() {
    if (!assetId) return
    Alert.alert(t("asset.delete.title"), t("asset.delete.body"), [
      { text: t("asset.delete.cancel"), style: "cancel" },
      {
        text: t("asset.delete.confirm"),
        style: "destructive",
        onPress: () => {
          void remove(assetId).then(onClose)
        },
      },
    ])
  }

  return (
    <Sheet open={open} onClose={onClose} scroll>
      <SheetHeader title={t("asset.form.editTitle")} onClose={onClose} />
      {assetId ? (
        <View className="px-5 pb-4 pt-1">
          {/* key by id so re-opening for a different asset re-seeds the form */}
          <AssetForm key={assetId} mode="edit" assetId={assetId} onDone={onClose} />

          <Button
            variant="outline"
            className="mt-3 h-[50px] rounded-2xl border-destructive/40"
            onPress={confirmDelete}
            accessibilityLabel={t("asset.detail.delete")}
          >
            <Icon as={Trash2} className="text-destructive" size={16} />
            <Text className="font-heading text-destructive">{t("asset.detail.delete")}</Text>
          </Button>
        </View>
      ) : null}
    </Sheet>
  )
}
