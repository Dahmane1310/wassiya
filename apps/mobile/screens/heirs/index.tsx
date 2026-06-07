import { useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"
import { AlertTriangle, Info, Plus, ShieldCheck, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { computeFaraid, type Gender, type Heir as EngineHeir } from "@workspace/faraid"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"
import { Pill } from "@/components/ui/pill"
import { ScreenHeader } from "@/components/ui/screen-header"
import { SectionLabel } from "@/components/ui/section-label"
import { heirPalette, useThemeColors } from "@/lib/colors"
import { pct } from "@/lib/estate-summary"
import { useDecryptedHeirs, type DecryptedHeir } from "@/screens/heirs/hooks/use-decrypted-heirs"
import { AddHeirSheet } from "@/screens/flows/add-heir-sheet"
import { Donut } from "@/screens/heirs/components/donut"
import { FamilyTree } from "@/screens/heirs/components/family-tree"

/** Heirs — interactive family tree wired to the REAL Fara'id engine
 *  (`@workspace/faraid`). Toggling living/deceased recomputes legal shares live
 *  (ephemeral what-if). Provisional — pending scholarly certification. */
export function HeirsScreen() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const palette = heirPalette(c)
  const { heirs, loading, add } = useDecryptedHeirs()
  const currentUser = useQuery(api.users.currentUser)
  const setOwnerGender = useMutation(api.users.setOwnerGender)

  const [override, setOverride] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAddHeir, setShowAddHeir] = useState(false)

  const relLabel = (h: DecryptedHeir) => {
    const base = t(`heirRel.${h.relationship}`)
    return h.lineage &&
      h.lineage !== "full" &&
      (h.relationship === "brother" || h.relationship === "sister")
      ? `${t(`heirLineage.${h.lineage}`)} ${base.toLowerCase()}`
      : base
  }

  const ownerGender = currentUser?.ownerGender ?? null
  const header = (
    <ScreenHeader
      title={t("heirs.title")}
      subtitle={t("heirs.subtitle")}
      action={
        <Pressable
          onPress={() => setShowAddHeir(true)}
          accessibilityLabel={t("heirs.add")}
          className="h-[46px] w-[46px] items-center justify-center rounded-full bg-gold-deep shadow-md shadow-black/10 active:opacity-80"
        >
          <Icon as={Plus} size={24} className="text-white" />
        </Pressable>
      }
    />
  )
  const sheet = (
    <AddHeirSheet
      open={showAddHeir}
      onClose={() => setShowAddHeir(false)}
      add={add}
      ownerGender={ownerGender}
    />
  )

  // Render the ScreenContainer + header + sheet ONCE; only the inner content
  // swaps between loading / empty / main. (Putting the sheet inside each branch
  // remounts it when the heir list goes empty→non-empty after the first add,
  // orphaning the native sheet so the next add can't present/submit.)
  function renderContent() {
    if (loading || heirs === null) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator />
        </View>
      )
    }

    if (heirs.length === 0) {
      return <EmptyState icon={Users} title={t("heirs.emptyTitle")} body={t("heirs.emptyBody")} />
    }

    const effective = heirs.map((h) => ({ ...h, isAlive: override[h.id] ?? h.isAlive }))
  const idx = new Map<string, number>(heirs.map((h, i) => [h.id, i]))
  const colorFor = (id: string) => palette[(idx.get(id) ?? 0) % palette.length]!
  const ownerInitials =
    ((currentUser?.firstName?.[0] ?? "") + (currentUser?.lastName?.[0] ?? "")).toUpperCase() || "•"

  const hasSpouse = effective.some((h) => h.relationship === "spouse" && h.isAlive)
  const result = computeFaraid({
    deceasedGender: ownerGender ?? undefined,
    heirs: effective.map<EngineHeir>((h) => ({
      id: h.id,
      relationship: h.relationship,
      lineage: h.lineage ?? undefined,
      gender: h.gender,
      isAlive: h.isAlive,
    })),
  })

  const isDefault = Object.keys(override).length === 0
  const toggle = (id: string) =>
    setOverride((o) => ({
      ...o,
      [id]: !(o[id] ?? heirs.find((h) => h.id === id)?.isAlive ?? true),
    }))

  const shareMap =
    result.status === "ok"
      ? new Map(result.shares.map((s) => [s.heirId, s]))
      : new Map<string, never>()
  const donutData = effective
    .filter((h) => h.relationship !== "other")
    .map((h) => ({ id: h.id, color: colorFor(h.id), value: shareMap.get(h.id)?.fraction ?? 0 }))
  const legend = result.status === "ok" ? [...result.shares].sort((a, b) => b.fraction - a.fraction) : []

    return (
      <>
        <FamilyTree
          members={effective}
          onToggle={toggle}
          colorFor={colorFor}
          label={relLabel}
          ownerInitials={ownerInitials}
        />

        {!isDefault ? (
          <View className="flex-row items-center gap-2.5 rounded-2xl border border-gold/30 bg-gold-soft px-3.5 py-3">
            <Icon as={Info} size={18} className="text-gold-deep" />
            <Text className="flex-1 font-sans-medium text-[13px] leading-[1.35] text-gold-deep">
              {t("heirs.whatIf")}
            </Text>
            <Pressable onPress={() => setOverride({})} className="active:opacity-70">
              <Text className="font-heading text-[13px] text-gold-deep">{t("heirs.reset")}</Text>
            </Pressable>
          </View>
        ) : null}

        <View>
          <SectionLabel right={<Pill tone="blue">{t("heirs.ifFiredToday")}</Pill>}>
            {t("heirs.distribution")}
          </SectionLabel>
          <View className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/5">
            {!ownerGender && hasSpouse ? (
              <GenderPrompt onSet={(g) => void setOwnerGender({ gender: g })} />
            ) : result.status === "needs_review" ? (
              <View className="flex-row items-start gap-2.5 rounded-xl bg-gold-soft p-3.5">
                <Icon as={AlertTriangle} size={18} className="text-gold-deep" />
                <View className="flex-1">
                  <Text className="font-heading text-[14px] text-gold-deep">{t("heirs.reviewTitle")}</Text>
                  <Text className="mt-0.5 font-sans-medium text-[12.5px] leading-[1.4] text-gold-deep">
                    {result.reason}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Donut
                  data={donutData}
                  activeId={activeId}
                  onPick={(id) => setActiveId((a) => (a === id ? null : id))}
                  centerTop={t("heirs.legalShares")}
                  centerMain={String(legend.length)}
                  centerSub={t("heirs.heirsLabel")}
                />
                {result.status === "ok" && result.adjustment !== "none" ? (
                  <View className="mt-3 self-center">
                    <Pill tone="gold">{t(`heirs.adj.${result.adjustment}`)}</Pill>
                  </View>
                ) : null}

                <View className="mt-4 gap-0.5">
                  {legend.map((s) => {
                    const heir = heirs.find((h) => h.id === s.heirId)
                    const on = activeId === s.heirId
                    return (
                      <Pressable
                        key={s.heirId}
                        onPress={() => setActiveId((a) => (a === s.heirId ? null : s.heirId))}
                        className={cn(
                          "flex-row items-center gap-3 rounded-xl px-2 py-2.5",
                          on && "bg-surface-2"
                        )}
                      >
                        <View className="h-3 w-3 rounded" style={{ backgroundColor: colorFor(s.heirId) }} />
                        <View className="min-w-0 flex-1">
                          <Text className="font-heading text-[14.5px] text-foreground">
                            {heir?.name ?? "—"}{" "}
                            <Text className="font-sans-medium text-[13px] text-ink-3">
                              · {heir ? relLabel(heir) : ""}
                            </Text>
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-mono text-[14px] text-foreground">
                            {s.numerator}/{s.denominator}
                          </Text>
                          <Text className="font-heading text-[11.5px] text-ink-3">{pct(s.fraction)}</Text>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              </>
            )}

            <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-primary-soft p-3">
              <Icon as={ShieldCheck} size={17} className="text-primary" />
              <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-primary">
                {t("heirs.sharia")}
              </Text>
            </View>
            <Text className="mt-2.5 text-center font-sans-medium text-[11px] leading-[1.4] text-ink-3">
              {t("heirs.disclaimer")}
            </Text>
          </View>
        </View>
      </>
    )
  }

  return (
    <ScreenContainer scroll edges={["top"]}>
      <View className="flex-1 gap-4 pb-6 pt-1">
        {header}
        {renderContent()}
      </View>
      {sheet}
    </ScreenContainer>
  )
}

function GenderPrompt({ onSet }: { onSet: (g: Gender) => void }) {
  const { t } = useTranslation()
  return (
    <View className="gap-3">
      <Text className="font-sans-medium text-[13px] leading-[1.4] text-ink-2">{t("heirs.genderPrompt")}</Text>
      <View className="flex-row gap-2.5">
        {(["male", "female"] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => onSet(g)}
            className="flex-1 items-center rounded-2xl border border-border bg-card py-3 active:opacity-80"
          >
            <Text className="font-heading text-[14px] text-foreground">{t(`gender.${g}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
