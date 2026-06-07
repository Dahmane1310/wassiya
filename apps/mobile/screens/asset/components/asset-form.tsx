import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Image, TextInput, View } from "react-native"
import { Lock } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { bytesToBase64 } from "@workspace/crypto"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { EncryptAnim } from "@/components/ui/encrypt-anim"
import { Field } from "@/components/ui/field"
import { useBrandType } from "@/hooks/use-brand-type"
import { useAsset } from "@/screens/asset/hooks/use-asset"
import { useAssets, type Attachment, type AssetDraft } from "@/hooks/use-assets"
import { isTrialExpired } from "@/lib/entitlement-error"
import { usePaywallStore } from "@/stores/paywall"
import { openDecryptedFile } from "@/lib/asset-file"
import { useThemeColors } from "@/lib/colors"
import { pickDetails } from "@/lib/asset-fields"
import { type AssetCategory, type AssetKind } from "@/lib/asset-crypto"
import { CategoryFields } from "@/screens/asset/components/category-fields"
import { CategorySelect } from "@/screens/asset/components/category-select"
import { FileAttachment } from "@/screens/asset/components/file-attachment"
import { KindToggle } from "@/screens/asset/components/kind-toggle"

/**
 * The asset create/edit form BODY (no screen container / header) so it can be
 * hosted either as a page (edit route) or a bottom sheet (create). PBKDF2 is NOT
 * re-run — the master key is in memory; encryption + upload happen in the hook on
 * save. `onDone` is called after a successful save (route → back, sheet → close).
 */
export function AssetForm({
  mode,
  assetId,
  onDone,
}: {
  mode: "create" | "edit"
  assetId?: Id<"assets">
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()
  const c = useThemeColors()
  const { create, update } = useAssets()
  const showPaywall = usePaywallStore((s) => s.show)
  const { asset, status, loadFile } = useAsset(mode === "edit" ? assetId : undefined)

  const [kind, setKind] = useState<AssetKind>("asset")
  const [category, setCategory] = useState<AssetCategory>("real_estate")
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [currency, setCurrency] = useState("")
  const [notes, setNotes] = useState("")
  const [details, setDetails] = useState<Record<string, string>>({})
  const [attachment, setAttachment] = useState<Attachment>({ kind: "none" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileBusy, setFileBusy] = useState(false)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const seeded = useRef(false)
  const setField = (key: string, val: string) => setDetails((d) => ({ ...d, [key]: val }))

  /** Decrypt + open the saved attachment: images preview inline, others via the
   *  OS share/Quick-Look sheet. Bytes are decrypted on demand, never persisted. */
  async function openFile() {
    if (!asset || fileBusy) return
    setFileBusy(true)
    try {
      const bytes = await loadFile()
      if (!bytes) return
      const meta = asset.payload.file
      if (meta?.mimeType?.startsWith("image/")) {
        setImageUri(`data:${meta.mimeType};base64,${bytesToBase64(bytes)}`)
      } else {
        await openDecryptedFile(bytes, meta?.name ?? "file", meta?.mimeType ?? undefined)
      }
    } catch {
      // Non-fatal: nothing plaintext is logged; the form stays usable.
    } finally {
      setFileBusy(false)
    }
  }

  useEffect(() => {
    if (mode !== "edit" || seeded.current || !asset) return
    const p = asset.payload
    setKind(p.kind)
    setCategory(p.category)
    setLabel(p.label)
    setValue(p.value === null ? "" : String(p.value))
    setCurrency(p.currency ?? "")
    setNotes(p.notes ?? "")
    setDetails(p.details ?? {})
    setAttachment(
      p.file ? { kind: "existing", name: p.file.name, mimeType: p.file.mimeType } : { kind: "none" }
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
      details: pickDetails(category, details),
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
      onDone()
    } catch (err) {
      if (isTrialExpired(err)) {
        onDone() // close first…
        // …then present the paywall next frame so it doesn't race the sheet dismiss
        // (present-over-dismiss can silently no-op on iOS). (Verify on device.)
        setTimeout(() => showPaywall(), 400)
        return
      }
      setError(err instanceof Error ? err.message : t("asset.error.save"))
      setBusy(false)
    }
  }

  if (mode === "edit" && status !== "ready") {
    return status === "loading" ? (
      <View className="items-center py-16">
        <ActivityIndicator />
      </View>
    ) : (
      <Text className={cn("text-sm text-destructive", body)}>{t("asset.error.load")}</Text>
    )
  }

  // While encryption + save run, swap the form for the "encrypting on device"
  // flourish so the security work is felt. `submit()` is unchanged.
  if (busy) {
    return <EncryptAnim plain={`${label} · ${value || "—"} · ${notes || "private notes"}`} />
  }

  return (
    <View>
      <View className="mb-4">
        <KindToggle value={kind} onChange={setKind} />
      </View>

      <View className="mb-3.5 gap-2">
        <Text className="font-sans-semibold text-[12.5px] text-ink-2">
          {t("asset.form.categoryLabel")}
        </Text>
        <CategorySelect value={category} onChange={setCategory} />
      </View>

      <Field label={t("asset.form.labelLabel")}>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder={t(`asset.namePlaceholder.${category}`)}
          placeholderTextColor={c.ink3}
          autoCapitalize="sentences"
          className="h-full flex-1 font-sans text-[15.5px] text-foreground"
        />
      </Field>

      <Field label={t("asset.form.valueLabel")}>
        <TextInput
          value={currency}
          onChangeText={(x) => setCurrency(x.toUpperCase())}
          placeholder="AED"
          placeholderTextColor={c.ink3}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={3}
          className="w-12 font-sans-semibold text-[14px] text-ink-3"
        />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="0"
          placeholderTextColor={c.ink3}
          keyboardType="numeric"
          className="h-full flex-1 font-mono text-[15.5px] text-foreground"
        />
      </Field>

      {/* category-specific fields (adapt to house / car / bank / …) */}
      <CategoryFields category={category} details={details} onChange={setField} />

      <Field label={t("asset.form.notesLabel")} tall>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t("asset.form.notesPlaceholder")}
          placeholderTextColor={c.ink3}
          multiline
          textAlignVertical="top"
          className="h-full flex-1 py-3 font-sans text-[15px] text-foreground"
        />
      </Field>

      <View className="mb-1">
        <Text className="mb-2 font-sans-semibold text-[12.5px] text-ink-2">
          {t("asset.form.fileLabel")}
        </Text>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="mb-2 h-48 w-full rounded-2xl"
            resizeMode="cover"
          />
        ) : null}
        <FileAttachment
          value={attachment}
          onChange={(a) => {
            setImageUri(null)
            setAttachment(a)
          }}
          onOpen={() => void openFile()}
          opening={fileBusy}
        />
      </View>

      {error ? (
        <Text className={cn("mt-2 text-sm text-destructive", body)}>{error}</Text>
      ) : null}

      <Button
        variant="vault"
        size="lg"
        className="mt-4 h-[54px] rounded-2xl"
        onPress={() => void submit()}
        disabled={!canSubmit}
        accessibilityLabel={t("asset.form.save")}
      >
        <Icon as={Lock} size={18} className="text-white" />
        <Text className={cn("font-heading text-white", ar ? body : undefined)}>
          {t("asset.form.save")}
        </Text>
      </Button>
    </View>
  )
}
