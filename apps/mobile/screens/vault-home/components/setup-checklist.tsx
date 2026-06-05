import { View } from "react-native"
import { Check, ChevronRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pill } from "@/components/ui/pill"
import { SectionLabel } from "@/components/ui/section-label"

type Item = { done: boolean; label: string }

const ITEMS: Item[] = [
  { done: true, label: "Vault passphrase created" },
  { done: true, label: "Beneficiaries linked" },
  { done: false, label: "Add power of attorney document" },
  { done: false, label: "Verify mother’s national ID" },
]

/** "Finish your vault" nudge list — completed items struck through, rest actionable. */
export function SetupChecklist() {
  const { t } = useTranslation()
  const remaining = ITEMS.filter((i) => !i.done).length
  return (
    <View>
      <SectionLabel right={<Pill tone="gold">{t("vaultHome.left", { count: remaining })}</Pill>}>
        {t("vaultHome.finishVault")}
      </SectionLabel>
      <View className="rounded-2xl border border-border bg-card px-1.5 py-0.5 shadow-sm shadow-black/5">
        {ITEMS.map((it, i) => (
          <View
            key={it.label}
            className={cn(
              "flex-row items-center gap-3 px-3 py-3",
              i < ITEMS.length - 1 && "border-b border-line-2"
            )}
          >
            <View
              className={cn(
                "h-[26px] w-[26px] items-center justify-center rounded-full",
                it.done ? "bg-green-soft" : "border border-dashed border-border bg-surface-3"
              )}
            >
              {it.done ? (
                <Icon as={Check} size={15} className="text-green" />
              ) : (
                <View className="h-1.5 w-1.5 rounded-full bg-ink-3" />
              )}
            </View>
            <Text
              className={cn(
                "flex-1 font-sans-semibold text-[14.5px]",
                it.done ? "text-ink-3 line-through" : "text-foreground"
              )}
            >
              {it.label}
            </Text>
            {!it.done ? <Icon as={ChevronRight} size={17} className="text-ink-3" /> : null}
          </View>
        ))}
      </View>
    </View>
  )
}
