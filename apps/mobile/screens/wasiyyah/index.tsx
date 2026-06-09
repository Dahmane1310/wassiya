import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useRouter } from "expo-router"
import { Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ScreenContainer } from "@/components/layout/screen-container"
import { Fab } from "@/components/ui/fab"
import { ScreenHeader } from "@/components/ui/screen-header"
import { SectionLabel } from "@/components/ui/section-label"
import { useDecryptedAssets } from "@/hooks/use-decrypted-assets"
import { useWasiyyah } from "@/screens/wasiyyah/hooks/use-wasiyyah"
import { BequestHero } from "@/screens/wasiyyah/components/bequest-hero"
import { BeneficiaryCard } from "@/screens/wasiyyah/components/beneficiary-card"
import { AllocationSheet, type Editing } from "@/screens/wasiyyah/components/allocation-sheet"

const CAP = 1 / 3

/** Wasiyyah — the freely-willed bequest, allocated per-beneficiary and hard-capped
 *  at one-third of the net estate (enforced in the editor + server-side). */
export function WasiyyahScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { allocations, beneficiaries, loading, setAllocation, removeAllocation } = useWasiyyah()
  const { summary } = useDecryptedAssets()

  const [allocOpen, setAllocOpen] = useState(false)
  const [editing, setEditing] = useState<Editing | null>(null)

  const header = <ScreenHeader title={t("wasiyyah.title")} subtitle={t("wasiyyah.subtitle")} />
  const openAdd = () => {
    setEditing(null)
    setAllocOpen(true)
  }

  if (loading || allocations === null || beneficiaries === null) {
    return (
      <ScreenContainer scroll edges={["top"]}>
        <View className="flex-1 gap-5 pb-6 pt-1">
          {header}
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        </View>
      </ScreenContainer>
    )
  }

  if (beneficiaries.length === 0) {
    return (
      <ScreenContainer scroll edges={["top"]}>
        <View className="flex-1 gap-5 pb-6 pt-1">
          {header}
          <View className="items-center gap-3 rounded-2xl border border-border bg-card px-5 py-10">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
              <Icon as={Users} size={26} className="text-gold-deep" />
            </View>
            <Text className="text-center font-heading text-[16px] text-foreground">
              {t("wasiyyah.needBeneficiariesTitle")}
            </Text>
            <Text className="text-center font-sans-medium text-[13px] leading-[1.4] text-ink-2">
              {t("wasiyyah.needBeneficiariesBody")}
            </Text>
            <Button
              variant="gold"
              className="mt-1 h-[48px] rounded-2xl px-6"
              onPress={() => router.push("/contacts")}
            >
              <Text className="font-heading text-white">{t("wasiyyah.addBeneficiaries")}</Text>
            </Button>
          </View>
        </View>
      </ScreenContainer>
    )
  }

  const totalPct = allocations.reduce((s, a) => s + a.percentage, 0)
  const total = totalPct / 100
  const netAmount = summary.primary?.net ?? 0
  const currency = summary.primary?.currency ?? ""

  const allocatedIds = new Set(allocations.map((a) => a.beneficiaryId as string))
  const candidates = beneficiaries.filter((b) => !allocatedIds.has(b.id as string))
  const maxFraction = editing ? CAP - (total - editing.percentage / 100) : CAP - total

  return (
    <ScreenContainer
      scroll
      edges={["top"]}
      fab={<Fab onPress={openAdd} label={t("wasiyyah.add")} />}
    >
      <View className="flex-1 gap-5 pb-6 pt-1">
        {header}

        <BequestHero total={total} cap={CAP} netAmount={netAmount} currency={currency} />

        <View className="gap-2.5">
          <SectionLabel
            right={
              <Text className="font-heading text-[12.5px] text-ink-3">
                {t("wasiyyah.nRecipients", { count: allocations.length })}
              </Text>
            }
          >
            {t("wasiyyah.beneficiaries")}
          </SectionLabel>
          {allocations.length === 0 ? (
            <Text className="rounded-2xl border border-border bg-card px-4 py-5 font-sans-medium text-[13px] text-ink-3">
              {t("wasiyyah.noAllocations")}
            </Text>
          ) : (
            allocations.map((a) => (
              <BeneficiaryCard
                key={a.id}
                name={a.name}
                percentage={a.percentage}
                onEdit={() => {
                  setEditing({
                    id: a.id,
                    beneficiaryId: a.beneficiaryId,
                    name: a.name,
                    percentage: a.percentage,
                  })
                  setAllocOpen(true)
                }}
              />
            ))
          )}
        </View>
      </View>

      <AllocationSheet
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        candidates={candidates}
        editing={editing}
        maxFraction={Math.max(0, maxFraction)}
        onSave={(beneficiaryId, percentage) => setAllocation(beneficiaryId as never, percentage)}
        onRemove={(id) => removeAllocation(id as never)}
      />
    </ScreenContainer>
  )
}
