import { Pressable, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useThemeColors } from "@/lib/colors"
import { initialsOf } from "@/lib/heir-crypto"
import type { DecryptedHeir } from "@/screens/heirs/hooks/use-decrypted-heirs"
import type { Relationship } from "@workspace/faraid"

const ANCESTORS: Relationship[] = ["father", "mother", "grandfather", "grandmother"]
const DESCENDANTS: Relationship[] = ["son", "daughter", "grandson", "granddaughter"]
const COLLATERALS: Relationship[] = ["brother", "sister", "other"]

/** Interactive family tree, grouped into ancestor / self+spouse / descendant /
 *  sibling tiers. Tap any relative to open their edit sheet (update details, mark
 *  living/deceased, or invite them). */
export function FamilyTree({
  members,
  onSelect,
  colorFor,
  label,
  ownerInitials,
}: {
  members: DecryptedHeir[]
  onSelect: (id: string) => void
  colorFor: (id: string) => string
  label: (h: DecryptedHeir) => string
  ownerInitials: string
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const inTier = (tier: Relationship[]) => members.filter((m) => tier.includes(m.relationship))
  const ancestors = inTier(ANCESTORS)
  const spouse = members.filter((m) => m.relationship === "spouse")
  const descendants = inTier(DESCENDANTS)
  const collaterals = inTier(COLLATERALS)

  const node = (m: DecryptedHeir) => (
    <TreeNode key={m.id} m={m} color={colorFor(m.id)} label={label(m)} onSelect={onSelect} />
  )

  return (
    <View className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
      <View className="mb-3.5 flex-row items-center justify-between">
        <Text className="font-sans-semibold text-[13px] uppercase tracking-wide text-ink-3">
          {t("heirs.familyTree")}
        </Text>
        <Text className="font-sans-medium text-[11.5px] text-ink-3">{t("heirs.tapHint")}</Text>
      </View>

      {ancestors.length > 0 ? (
        <>
          <View className="flex-row flex-wrap justify-center gap-[18px]">{ancestors.map(node)}</View>
          <Connector />
        </>
      ) : null}

      <View className="flex-row flex-wrap items-center justify-center gap-[18px]">
        <View className="w-16 items-center gap-1">
          <View
            className="h-[54px] w-[54px] items-center justify-center rounded-full border-2 bg-vault-2"
            style={{ borderColor: c.gold }}
          >
            <Text className="font-heading text-[15px] text-white">{ownerInitials}</Text>
          </View>
          <Text className="font-heading text-[12px] text-foreground">{t("heirs.you")}</Text>
          <Text className="font-sans-semibold text-[10px] text-gold-deep">{t("heirs.owner")}</Text>
        </View>
        {spouse.map(node)}
      </View>

      {descendants.length > 0 ? (
        <>
          <Connector />
          <View className="flex-row flex-wrap justify-center gap-3">{descendants.map(node)}</View>
        </>
      ) : null}

      {collaterals.length > 0 ? (
        <View className="mt-3 border-t border-line-2 pt-3">
          <Text className="mb-2 text-center font-sans-semibold text-[11px] uppercase tracking-wide text-ink-3">
            {t("heirs.siblings")}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3">{collaterals.map(node)}</View>
        </View>
      ) : null}
    </View>
  )
}

function TreeNode({
  m,
  color,
  label,
  onSelect,
}: {
  m: DecryptedHeir
  color: string
  label: string
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation()
  const name = m.name ?? "—"
  return (
    <Pressable onPress={() => onSelect(m.id)} className="w-16 items-center gap-1 active:opacity-70">
      <View
        className="h-[50px] w-[50px] items-center justify-center rounded-full"
        style={{
          backgroundColor: color + (m.isAlive ? "29" : "14"),
          borderWidth: m.isAlive ? 2 : 0,
          borderColor: color,
          opacity: m.isAlive ? 1 : 0.6,
        }}
      >
        <Text className="font-heading text-[15px]" style={{ color }}>
          {initialsOf(name)}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className={cn("font-heading text-[12px]", m.isAlive ? "text-foreground" : "text-ink-3")}
      >
        {name}
      </Text>
      <Text className="font-sans-semibold text-[10px] text-ink-3">
        {m.isAlive ? label : t("heirs.deceased")}
      </Text>
    </Pressable>
  )
}

function Connector() {
  return <View className="mx-auto my-2 h-[18px] w-0.5 bg-border" />
}
