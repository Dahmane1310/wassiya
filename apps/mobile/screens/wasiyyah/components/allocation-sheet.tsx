import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"
import { Trash2 } from "lucide-react-native"
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

/** Set a beneficiary's bequest %. Add mode picks a beneficiary; edit mode fixes
 *  it + allows remove. The slider is capped at the remaining ⅓ headroom. */
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
  const [selected, setSelected] = useState<string | null>(null)
  const [value, setValue] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setSelected(editing.beneficiaryId)
      setValue(editing.percentage / 100)
    } else {
      setSelected(null)
      setValue(0)
    }
  }, [open, editing])

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
      <View className="px-5 pb-3 pt-2">
        {!editing ? (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {candidates.map((b) => {
              const on = selected === b.id
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setSelected(b.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 active:opacity-80",
                    on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                  )}
                >
                  <Text className={cn("font-heading text-[12.5px]", on ? "text-gold-deep" : "text-foreground")}>
                    {b.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}

        <View className="flex-row items-baseline justify-between">
          <Text className="font-sans-semibold text-[12.5px] uppercase tracking-wide text-ink-3">
            {t("wasiyyah.share")}
          </Text>
          <Text className="font-display text-[26px] text-gold-deep">{pct(value)}</Text>
        </View>
        <View className="mt-3">
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
          disabled={!selected || busy}
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
    </Sheet>
  )
}
