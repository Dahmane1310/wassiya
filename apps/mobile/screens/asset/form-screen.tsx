import { router, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { ScreenContainer } from "@/components/layout/screen-container"
import { AssetForm } from "@/screens/asset/components/asset-form"
import { AssetScreenHeader } from "@/screens/asset/components/asset-screen-header"

/** The asset form as a full PAGE (used by the edit route). Create is presented as
 *  a bottom sheet instead — see `AddAssetSheet`. */
export function AssetFormScreen({ mode }: { mode: "create" | "edit" }) {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const assetId = id ? (id as Id<"assets">) : undefined
  const title = t(mode === "edit" ? "asset.form.editTitle" : "asset.form.createTitle")

  return (
    <ScreenContainer scroll edges={["top"]} contentClassName="pb-10">
      <AssetScreenHeader title={title} />
      <AssetForm mode={mode} assetId={assetId} onDone={() => router.back()} />
    </ScreenContainer>
  )
}
