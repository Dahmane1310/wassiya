import { ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui-native/components/ui/dialog"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

/** Destructive confirm before permanently deleting an asset + its file. */
export function DeleteAssetDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()
  const textFont = ar ? body : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("asset.delete.title")}</DialogTitle>
          <DialogDescription>{t("asset.delete.body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onPress={() => onOpenChange(false)}
            disabled={busy}
          >
            <Text className={textFont}>{t("asset.delete.cancel")}</Text>
          </Button>
          <Button variant="destructive" onPress={onConfirm} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={textFont}>{t("asset.delete.confirm")}</Text>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
