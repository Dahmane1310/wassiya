import { useTranslation } from "react-i18next"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { AddAssetFlow } from "@/screens/asset/components/add-asset-flow"

/** Create a new asset as the design's 3-step bottom sheet (category grid →
 *  encrypted form → encrypt animation). Edit stays a full page. */
export function AddAssetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onClose={onClose} scroll>
      <SheetHeader
        title={t("asset.form.createTitle")}
        subtitle={t("asset.form.createSub")}
        onClose={onClose}
      />
      <AddAssetFlow onDone={onClose} />
    </Sheet>
  )
}
