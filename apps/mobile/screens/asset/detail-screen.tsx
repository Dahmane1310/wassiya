import { useState } from "react"
import { ActivityIndicator, Image, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { FileText, Pencil, Trash2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { bytesToBase64 } from "@workspace/crypto"
import { Badge } from "@workspace/ui-native/components/ui/badge"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Card, CardContent } from "@workspace/ui-native/components/ui/card"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Separator } from "@workspace/ui-native/components/ui/separator"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { ScreenContainer } from "@/components/layout/screen-container"
import { EncField } from "@/components/ui/enc-field"
import { useBrandType } from "@/hooks/use-brand-type"
import { useAsset } from "@/screens/asset/hooks/use-asset"
import { useAssets } from "@/hooks/use-assets"
import { categoryIcon } from "@/lib/asset-categories"
import { ASSET_FIELDS, CATEGORY_FIELDS } from "@/lib/asset-fields"
import { openDecryptedFile } from "@/lib/asset-file"
import { AssetDetailSkeleton } from "@/screens/asset/components/asset-detail-skeleton"
import { AssetScreenHeader } from "@/screens/asset/components/asset-screen-header"
import { DeleteAssetDialog } from "@/screens/asset/components/delete-asset-dialog"

/** Read a single decrypted asset; open its file (image inline, others via the
 *  OS share sheet); edit or delete it. */
export function AssetDetailScreen() {
  const { t } = useTranslation()
  const { ar, body, display, tracking } = useBrandType()
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { asset, status, loadFile } = useAsset(assetId)
  const { remove } = useAssets()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const textFont = ar ? body : undefined

  async function openFile() {
    if (!asset) return
    setFileBusy(true)
    try {
      const bytes = await loadFile()
      if (!bytes) return
      const meta = asset.payload.file
      if (meta?.mimeType?.startsWith("image/")) {
        setImageUri(`data:${meta.mimeType};base64,${bytesToBase64(bytes)}`)
      } else {
        await openDecryptedFile(
          bytes,
          meta?.name ?? "file",
          meta?.mimeType ?? undefined
        )
      }
    } catch {
      // Non-fatal: leave the screen usable; nothing plaintext is logged.
    } finally {
      setFileBusy(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await remove(assetId)
      router.back()
    } catch {
      setDeleting(false)
    }
  }

  if (status !== "ready" || !asset) {
    return (
      <ScreenContainer scroll edges={["top"]}>
        <AssetScreenHeader title={t("asset.detail.title")} />
        {status === "loading" ? (
          <AssetDetailSkeleton />
        ) : (
          <Text className={cn("text-sm text-destructive", body)}>
            {t("asset.error.load")}
          </Text>
        )}
      </ScreenContainer>
    )
  }

  const p = asset.payload
  const CategoryIcon = categoryIcon(p.category)
  return (
    <ScreenContainer scroll edges={["top"]} contentClassName="pb-10">
      <AssetScreenHeader title={t("asset.detail.title")} />
      <View className="gap-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon as={CategoryIcon} className="text-primary" size={24} />
          </View>
          <View className="flex-1 gap-1">
            <Text className={cn("text-xl text-foreground", display, tracking)}>
              {p.label}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className={cn("text-sm text-muted-foreground", body)}>
                {t(`asset.category.${p.category}`)}
              </Text>
              {p.kind === "debt" ? (
                <Badge variant="destructive">
                  <Text className={textFont}>{t("asset.badge.debt")}</Text>
                </Badge>
              ) : null}
            </View>
          </View>
        </View>

        {p.value !== null || p.notes ? (
          <Card>
            <CardContent className="gap-3">
              {p.value !== null ? (
                <View className="flex-row items-center justify-between">
                  <Text className={cn("text-xs text-muted-foreground", body)}>
                    {t("asset.detail.valueLabel")}
                  </Text>
                  <Text className={cn("text-base text-foreground", body)}>
                    {p.currency ? `${p.currency} ${p.value}` : String(p.value)}
                  </Text>
                </View>
              ) : null}
              {p.value !== null && p.notes ? <Separator /> : null}
              {p.notes ? (
                <View className="gap-1">
                  <Text className={cn("text-xs text-muted-foreground", body)}>
                    {t("asset.detail.notesLabel")}
                  </Text>
                  <Text className={cn("text-base text-foreground", body)}>
                    {p.notes}
                  </Text>
                </View>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {p.details && CATEGORY_FIELDS[p.category].some((k) => p.details?.[k]) ? (
          <Card>
            <CardContent className="gap-3">
              {CATEGORY_FIELDS[p.category]
                .filter((k) => p.details?.[k])
                .map((k, i, arr) => {
                  const v = p.details![k]!
                  const def = ASSET_FIELDS[k]!
                  return (
                    <View key={k} className="gap-3">
                      {def.sensitive ? (
                        <EncField label={t(`assetFields.${k}`)} value={v} />
                      ) : (
                        <View className="gap-1">
                          <Text className={cn("text-xs text-muted-foreground", body)}>
                            {t(`assetFields.${k}`)}
                          </Text>
                          <Text className={cn("text-base text-foreground", body)}>{v}</Text>
                        </View>
                      )}
                      {i < arr.length - 1 ? <Separator /> : null}
                    </View>
                  )
                })}
            </CardContent>
          </Card>
        ) : null}

        {p.file ? (
          <View className="gap-2">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="h-56 w-full rounded-xl"
                resizeMode="cover"
              />
            ) : null}
            <Button
              variant="outline"
              onPress={() => void openFile()}
              disabled={fileBusy}
            >
              {fileBusy ? (
                <ActivityIndicator />
              ) : (
                <Icon as={FileText} className="text-foreground" size={16} />
              )}
              <Text className={textFont}>
                {imageUri ? p.file.name : t("asset.detail.openFile")}
              </Text>
            </Button>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() =>
              router.push({
                pathname: "/vault/edit/[id]",
                params: { id: assetId },
              })
            }
          >
            <Icon as={Pencil} className="text-foreground" size={16} />
            <Text className={textFont}>{t("asset.detail.edit")}</Text>
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onPress={() => setConfirmOpen(true)}
          >
            <Icon as={Trash2} className="text-white" size={16} />
            <Text className={textFont}>{t("asset.detail.delete")}</Text>
          </Button>
        </View>
      </View>

      <DeleteAssetDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void confirmDelete()}
        busy={deleting}
      />
    </ScreenContainer>
  )
}
