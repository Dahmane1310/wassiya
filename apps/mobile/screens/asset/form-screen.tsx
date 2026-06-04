import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Input } from "@workspace/ui-native/components/ui/input"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { ScreenContainer } from "@/components/layout/screen-container"
import { useBrandType } from "@/hooks/use-brand-type"
import { useAsset } from "@/hooks/use-asset"
import {
  useAssets,
  type Attachment,
  type AssetDraft,
} from "@/hooks/use-assets"
import { type AssetCategory, type AssetKind } from "@/lib/asset-crypto"
import { AssetScreenHeader } from "@/screens/asset/components/asset-screen-header"
import { CategorySelect } from "@/screens/asset/components/category-select"
import { FileAttachment } from "@/screens/asset/components/file-attachment"
import { KindToggle } from "@/screens/asset/components/kind-toggle"

/** Create or edit an asset. PBKDF2 is NOT re-run (the master key is in memory);
 *  encryption + any file upload happen in the hook on save. */
export function AssetFormScreen({ mode }: { mode: "create" | "edit" }) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const assetId = id ? (id as Id<"assets">) : undefined
  const { create, update } = useAssets()
  const { asset, status } = useAsset(mode === "edit" ? assetId : undefined)

  const [kind, setKind] = useState<AssetKind>("asset")
  const [category, setCategory] = useState<AssetCategory>("real_estate")
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [currency, setCurrency] = useState("")
  const [notes, setNotes] = useState("")
  const [attachment, setAttachment] = useState<Attachment>({ kind: "none" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seeded = useRef(false)

  // Seed the form from the decrypted asset once, in edit mode.
  useEffect(() => {
    if (mode !== "edit" || seeded.current || !asset) return
    const p = asset.payload
    setKind(p.kind)
    setCategory(p.category)
    setLabel(p.label)
    setValue(p.value === null ? "" : String(p.value))
    setCurrency(p.currency ?? "")
    setNotes(p.notes ?? "")
    setAttachment(
      p.file
        ? { kind: "existing", name: p.file.name, mimeType: p.file.mimeType }
        : { kind: "none" }
    )
    seeded.current = true
  }, [mode, asset])

  const canSubmit = label.trim().length > 0 && !busy

  async function submit() {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const parsed = value.trim() === "" ? null : Number(value)
    const draft: AssetDraft = {
      kind,
      category,
      label: label.trim(),
      value: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      currency: currency.trim() === "" ? null : currency.trim(),
      notes: notes.trim() === "" ? null : notes.trim(),
    }
    try {
      if (mode === "edit" && assetId && asset) {
        await update(assetId, draft, attachment, {
          ownerWrappedKey: asset.ownerWrappedKey,
          ownerWrapIv: asset.ownerWrapIv,
          storageId: asset.storageId,
          fileIv: asset.fileIv,
          createdAt: asset.createdAt,
        })
      } else {
        await create(draft, attachment)
      }
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("asset.error.save"))
      setBusy(false)
    }
  }

  const title = t(mode === "edit" ? "asset.form.editTitle" : "asset.form.createTitle")
  const labelClass = cn("text-sm text-foreground", body)

  if (mode === "edit" && status !== "ready") {
    return (
      <ScreenContainer scroll edges={["top"]}>
        <AssetScreenHeader title={title} />
        {status === "loading" ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : (
          <Text className={cn("text-sm text-destructive", body)}>
            {t("asset.error.load")}
          </Text>
        )}
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer scroll edges={["top"]} contentClassName="pb-10">
      <AssetScreenHeader title={title} />
      <View className="gap-4">
        <KindToggle value={kind} onChange={setKind} />

        <View className="gap-2">
          <Text className={labelClass}>{t("asset.form.categoryLabel")}</Text>
          <CategorySelect value={category} onChange={setCategory} />
        </View>

        <View className="gap-2">
          <Text className={labelClass}>{t("asset.form.labelLabel")}</Text>
          <Input
            value={label}
            onChangeText={setLabel}
            placeholder={t("asset.form.labelPlaceholder")}
            autoCapitalize="sentences"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <Text className={labelClass}>{t("asset.form.valueLabel")}</Text>
            <Input
              value={value}
              onChangeText={setValue}
              placeholder={t("asset.form.valuePlaceholder")}
              keyboardType="numeric"
            />
          </View>
          <View className="w-28 gap-2">
            <Text className={labelClass}>{t("asset.form.currencyLabel")}</Text>
            <Input
              value={currency}
              onChangeText={(x) => setCurrency(x.toUpperCase())}
              placeholder={t("asset.form.currencyPlaceholder")}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={3}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className={labelClass}>{t("asset.form.notesLabel")}</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t("asset.form.notesPlaceholder")}
            multiline
            textAlignVertical="top"
            className="h-24 py-2"
          />
        </View>

        <View className="gap-2">
          <Text className={labelClass}>{t("asset.form.fileLabel")}</Text>
          <FileAttachment value={attachment} onChange={setAttachment} />
        </View>

        {error ? (
          <Text className={cn("text-sm text-destructive", body)}>{error}</Text>
        ) : null}

        <Button
          size="lg"
          onPress={() => void submit()}
          disabled={!canSubmit}
          accessibilityLabel={t("asset.form.save")}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={ar ? body : undefined}>{t("asset.form.save")}</Text>
          )}
        </Button>
      </View>
    </ScreenContainer>
  )
}
