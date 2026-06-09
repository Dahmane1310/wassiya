import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"
import { ChevronRight, Trash2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { pct } from "@/lib/estate-summary"
import type { AllocBeneficiary } from "@/screens/wasiyyah/hooks/use-wasiyyah"
import { CapSlider } from "@/screens/wasiyyah/components/cap-slider"

export type Editing = { id: string; beneficiaryId: string; name: string; percentage: number }

const PRESETS = [5, 10, 15, 20, 25, 30]
const initials = (n: string) => {
  const p = n.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "•"
}

/**
 * Set a beneficiary's bequest %, as a 2-step sheet (like add-asset/add-heir): pick a
 * beneficiary, then set the share with quick presets + the ⅓-capped slider. Edit mode
 * jumps straight to the share step and allows remove.
 */
export function AllocationSheet({
  open,
  onClose,
  candidates,
  editing,
  maxFraction,
  onSave,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  candidates: AllocBeneficiary[]
  editing: Editing | null
  /** Largest fraction this allocation may take (cap − others). */
  maxFraction: number
  onSave: (beneficiaryId: string, percentage: number) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<"pick" | "amount">("pick")
  const [selected, setSelected] = useState<string | null>(null)
  const [value, setValue] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setSelected(editing.beneficiaryId)
      setValue(editing.percentage / 100)
      setStep("amount")
    } else {
      setSelected(null)
      setValue(0)
      setStep("pick")
    }
  }, [open, editing])

  const selectedName = editing ? editing.name : candidates.find((b) => b.id === selected)?.name ?? ""
  const capPct = Math.floor(maxFraction * 100)
  const presets = PRESETS.filter((p) => p <= capPct)

  function pick(b: AllocBeneficiary) {
    setSelected(b.id)
    setStep("amount")
  }

  async function save() {
    if (!selected || busy) return
    setBusy(true)
    try {
      await onSave(selected, Math.round(value * 1000) / 10)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title={t(editing ? "wasiyyah.editAllocation" : "wasiyyah.addAllocation")}
        subtitle={editing ? editing.name : t("wasiyyah.pickBeneficiary")}
        onClose={onClose}
      />

      {step === "pick" ? (
        <View className="px-5 pb-4 pt-1">
          {candidates.length === 0 ? (
            <Text className="rounded-2xl border border-border bg-card px-4 py-5 font-sans-medium text-[13px] text-ink-3">
              {t("wasiyyah.allAllocated")}
            </Text>
          ) : (
            <View className="overflow-hidden rounded-2xl border border-border bg-card px-1.5">
              {candidates.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() => pick(b)}
                  className={cn(
                    "flex-row items-center gap-3 px-3 py-3.5 active:opacity-70",
                    i < candidates.length - 1 && "border-b border-line-2"
                  )}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-gold-soft">
                    <Text className="font-heading text-[12px] text-gold-deep">{initials(b.name)}</Text>
                  </View>
                  <Text className="flex-1 font-heading text-[14.5px] text-foreground">{b.name}</Text>
                  <Icon as={ChevronRight} size={18} className="text-ink-3" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="px-5 pb-4 pt-1">
          <View className="mb-5 flex-row items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gold-soft">
              <Text className="font-heading text-[12.5px] text-gold-deep">{initials(selectedName)}</Text>
            </View>
            <Text className="flex-1 font-heading text-[14.5px] text-foreground">{selectedName}</Text>
            {!editing ? (
              <Pressable onPress={() => setStep("pick")} hitSlop={8} className="active:opacity-70">
                <Text className="font-heading text-[13px] text-primary">{t("asset.form.change")}</Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row items-baseline justify-between">
            <Text className="font-sans-semibold text-[12.5px] uppercase tracking-wide text-ink-3">
              {t("wasiyyah.share")}
            </Text>
            <Text className="font-display text-[30px] text-gold-deep">{pct(value)}</Text>
          </View>

          {presets.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {presets.map((p) => {
                const on = Math.abs(value - p / 100) < 0.001
                return (
                  <Pressable
                    key={p}
                    onPress={() => setValue(p / 100)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 active:opacity-80",
                      on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                    )}
                  >
                    <Text className={cn("font-heading text-[12.5px]", on ? "text-gold-deep" : "text-foreground")}>
                      {p}%
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          <View className="mt-4">
            <CapSlider
              value={value}
              cap={maxFraction}
              onChange={setValue}
              capLabel={t("wasiyyah.maxHeadroom", { pct: pct(maxFraction) })}
            />
          </View>

          <Button
            variant="gold"
            className="mt-5 h-[54px] rounded-2xl"
            disabled={!selected || value <= 0 || busy}
            onPress={() => void save()}
          >
            {busy ? <ActivityIndicator color="white" /> : <Text className="font-heading text-white">{t("wasiyyah.save")}</Text>}
          </Button>

          {editing ? (
            <Pressable
              onPress={() => void onRemove(editing.id).then(onClose)}
              className="mt-3 flex-row items-center justify-center gap-2 py-2 active:opacity-70"
            >
              <Icon as={Trash2} size={17} className="text-danger" />
              <Text className="font-heading text-[13.5px] text-danger">{t("wasiyyah.removeAllocation")}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Sheet>
  )
}
