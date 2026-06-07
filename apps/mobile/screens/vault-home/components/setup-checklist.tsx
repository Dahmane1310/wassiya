import { View } from "react-native"
import { Check, ChevronRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pill } from "@/components/ui/pill"
import { SectionLabel } from "@/components/ui/section-label"
import { useVaultSetup } from "@/screens/vault-home/hooks/use-vault-setup"

/** "Finish your vault" nudge list — real setup steps (from `useVaultSetup`) with
 *  completed items struck through and the remainder actionable. */
export function SetupChecklist() {
  const { t } = useTranslation()
  const { items, doneCount, total } = useVaultSetup()
  const remaining = total - doneCount
  const allDone = remaining === 0

  return (
    <View>
      <SectionLabel
        right={
          <Pill tone={allDone ? "green" : "gold"}>
            {allDone ? t("vaultHome.allSet") : t("vaultHome.left", { count: remaining })}
          </Pill>
        }
      >
        {t("vaultHome.finishVault")}
      </SectionLabel>
      <View className="rounded-2xl border border-border bg-card px-1.5 py-0.5 shadow-sm shadow-black/5">
        {items.map((it, i) => (
          <View
            key={it.key}
            className={cn(
              "flex-row items-center gap-3 px-3 py-3",
              i < items.length - 1 && "border-b border-line-2"
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
              {t(`vaultHome.setup.${it.key}`)}
            </Text>
            {!it.done ? <Icon as={ChevronRight} size={17} className="text-ink-3" /> : null}
          </View>
        ))}
      </View>
    </View>
  )
}
