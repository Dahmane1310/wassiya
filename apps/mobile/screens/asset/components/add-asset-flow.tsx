import { useState } from "react"
import { ActivityIndicator, Pressable, TextInput, View } from "react-native"
import { Lock } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EncryptAnim } from "@/components/ui/encrypt-anim"
import { IconBadge } from "@/components/ui/icon-badge"
import { useThemeColors, type ThemeColors } from "@/lib/colors"
import { ASSET_CATEGORIES, categoryIcon } from "@/lib/asset-categories"
import { pickDetails } from "@/lib/asset-fields"
import { type AssetCategory, type AssetKind } from "@/lib/asset-crypto"
import { useAssets, type Attachment, type AssetDraft } from "@/hooks/use-assets"
import { CategoryFields, Field } from "@/screens/asset/components/category-fields"
import { FileAttachment } from "@/screens/asset/components/file-attachment"
import { KindToggle } from "@/screens/asset/components/kind-toggle"

// A distinct tint per category for the grid badges.
const CAT_COLOR: Record<AssetCategory, keyof ThemeColors> = {
  real_estate: "primary",
  bank_account: "green",
  vehicle: "violet",
  cash: "goldDeep",
  business: "teal",
  crypto: "gold",
  document: "ink2",
  other: "ink3",
}

/**
 * The design's 3-step add-asset flow: choose a category → fill a form that ADAPTS
 * to that category (a car asks make/model/plate, a house asks address/deed, a bank
 * account asks IBAN…) → watch the on-device encrypt animation. Wired to the real
 * `create` (AES-GCM + optional file upload); `onDone` closes the sheet.
 */
export function AddAssetFlow({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const { create } = useAssets()

  const [step, setStep] = useState<"category" | "form">("category")
  const [kind, setKind] = useState<AssetKind>("asset")
  const [category, setCategory] = useState<AssetCategory>("real_estate")
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [currency, setCurrency] = useState("AED")
  const [details, setDetails] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")
  const [attachment, setAttachment] = useState<Attachment>({ kind: "none" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (key: string, val: string) => setDetails((d) => ({ ...d, [key]: val }))

  async function submit() {
    if (label.trim().length === 0 || busy) return
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
      // Let the encrypt animation play through while the real work runs.
      await Promise.all([create(draft, attachment), new Promise((r) => setTimeout(r, 1700))])
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("asset.error.save"))
      setBusy(false)
    }
  }

  // Step 3 — the on-device encrypt flourish.
  if (busy) {
    return (
      <View className="px-5">
        <EncryptAnim plain={`${label} · ${value || "—"} · ${Object.values(details).join(" ") || "private"}`} />
      </View>
    )
  }

  // Step 1 — category grid.
  if (step === "category") {
    return (
      <View className="px-4 pb-3 pt-1">
        <Text className="mb-3 px-1 font-sans-medium text-[13.5px] text-ink-2">
          {t("asset.form.chooseCategory")}
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {ASSET_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                setCategory(cat)
                setStep("form")
              }}
              style={{ width: "47.5%" }}
              className="rounded-2xl border border-border bg-card p-4 active:opacity-80"
            >
              <IconBadge icon={categoryIcon(cat)} color={c[CAT_COLOR[cat]]} size={42} radius={12} />
              <Text className="mt-2.5 font-heading text-[14.5px] text-foreground">
                {t(`asset.category.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  // Step 2 — the encrypted, category-aware form.
  return (
    <View className="px-5 pb-3 pt-1">
      <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <IconBadge icon={categoryIcon(category)} color={c[CAT_COLOR[category]]} size={40} radius={11} />
        <Text className="flex-1 font-heading text-[14.5px] text-foreground">
          {t(`asset.category.${category}`)}
        </Text>
        <Pressable onPress={() => setStep("category")} hitSlop={8} className="active:opacity-70">
          <Text className="font-heading text-[13px] text-primary">{t("asset.form.change")}</Text>
        </Pressable>
      </View>

      <View className="mb-4">
        <KindToggle value={kind} onChange={setKind} />
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

      {/* category-specific fields (house ≠ car ≠ bank …) */}
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

      <View className="mb-1 mt-1">
        <Text className="mb-2 font-sans-semibold text-[12.5px] text-ink-2">{t("asset.form.fileLabel")}</Text>
        <FileAttachment value={attachment} onChange={setAttachment} />
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Icon as={Lock} size={14} className="text-green" />
        <Text className="flex-1 font-sans-medium text-[12px] leading-[1.4] text-ink-3">
          {t("asset.form.lockNote")}
        </Text>
      </View>

      {error ? <Text className="mt-2 font-sans-medium text-[13px] text-danger">{error}</Text> : null}

      <Button
        variant="vault"
        size="lg"
        className="mt-4 h-[54px] rounded-2xl"
        disabled={label.trim().length === 0}
        onPress={() => void submit()}
      >
        <Icon as={Lock} size={18} className="text-white" />
        <Text className="font-heading text-white">{t("asset.form.encryptSave")}</Text>
      </Button>
    </View>
  )
}
