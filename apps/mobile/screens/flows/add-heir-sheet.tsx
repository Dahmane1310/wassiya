import { useState } from "react"
import { ActivityIndicator, Pressable, TextInput, View } from "react-native"
import { Heart, Scale, User, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import type { Gender, Lineage, Relationship } from "@workspace/faraid"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useThemeColors } from "@/lib/colors"
import type { HeirDraft } from "@/screens/heirs/hooks/use-heirs"

const RELS: { key: Relationship; icon: typeof User; lineage: boolean }[] = [
  { key: "spouse", icon: Heart, lineage: false },
  { key: "father", icon: User, lineage: false },
  { key: "mother", icon: User, lineage: false },
  { key: "son", icon: User, lineage: false },
  { key: "daughter", icon: User, lineage: false },
  { key: "brother", icon: Users, lineage: true },
  { key: "sister", icon: Users, lineage: true },
]
const LINEAGES: Lineage[] = ["full", "paternal", "maternal"]
const FIXED_GENDER: Partial<Record<Relationship, Gender>> = {
  father: "male",
  son: "male",
  brother: "male",
  mother: "female",
  daughter: "female",
  sister: "female",
}

/** Add a family member. Gender is derived from the relationship (spouse = opposite
 *  of the owner); siblings also pick a lineage. Persists via `addFamilyMember`. */
export function AddHeirSheet({
  open,
  onClose,
  add,
  ownerGender,
}: {
  open: boolean
  onClose: () => void
  add: (draft: HeirDraft) => Promise<void>
  ownerGender: Gender | null
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const [rel, setRel] = useState<Relationship | null>(null)
  const [lineage, setLineage] = useState<Lineage>("full")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = RELS.find((r) => r.key === rel)
  const genderFor = (r: Relationship): Gender | null =>
    r === "spouse" ? (ownerGender ? (ownerGender === "male" ? "female" : "male") : null) : (FIXED_GENDER[r] ?? null)
  const gender = rel ? genderFor(rel) : null
  const spouseBlocked = rel === "spouse" && !ownerGender

  const close = () => {
    setRel(null)
    setLineage("full")
    setName("")
    setError(null)
    onClose()
  }

  async function submit() {
    if (!rel || !gender || !name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await add({ relationship: rel, lineage: meta?.lineage ? lineage : undefined, gender, name })
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader title={t("addHeir.title")} subtitle={t("addHeir.subtitle")} onClose={close} />
      <View className="px-5 pb-3 pt-2">
        <Text className="mb-2.5 font-sans-semibold text-[12.5px] text-ink-2">{t("addHeir.relationship")}</Text>
        <View className="flex-row flex-wrap gap-2.5">
          {RELS.map((r) => {
            const on = rel === r.key
            return (
              <Pressable
                key={r.key}
                onPress={() => setRel(r.key)}
                style={{ width: "31%" }}
                className={cn(
                  "items-center gap-1.5 rounded-2xl border py-3.5 active:opacity-80",
                  on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                )}
              >
                <r.icon size={20} color={on ? c.goldDeep : c.ink2} strokeWidth={2} />
                <Text className={cn("font-heading text-[12.5px]", on ? "text-gold-deep" : "text-foreground")}>
                  {t(`heirRel.${r.key}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {meta?.lineage ? (
          <>
            <Text className="mb-2 mt-4 font-sans-semibold text-[12.5px] text-ink-2">{t("addHeir.lineage")}</Text>
            <View className="flex-row gap-2.5">
              {LINEAGES.map((l) => {
                const on = lineage === l
                return (
                  <Pressable
                    key={l}
                    onPress={() => setLineage(l)}
                    className={cn(
                      "flex-1 items-center rounded-2xl border py-2.5 active:opacity-80",
                      on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                    )}
                  >
                    <Text className={cn("font-heading text-[12.5px]", on ? "text-gold-deep" : "text-foreground")}>
                      {t(`heirLineage.${l}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        ) : null}

        <View className="mt-4">
          <Field label={t("addHeir.fullName")}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("addHeir.namePlaceholder")}
              placeholderTextColor={c.ink3}
              autoCapitalize="words"
              className="h-full flex-1 font-sans text-[15.5px] text-foreground"
            />
          </Field>
        </View>

        {spouseBlocked ? (
          <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{t("addHeir.spouseNeedsGender")}</Text>
        ) : null}
        {error ? <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{error}</Text> : null}

        <View className="mt-4 flex-row items-center gap-2.5 rounded-2xl bg-green-soft p-3.5">
          <Scale size={18} color={c.green} strokeWidth={1.9} />
          <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-green">{t("addHeir.note")}</Text>
        </View>

        <Button
          variant="gold"
          className="mt-5 h-[54px] rounded-2xl"
          disabled={!rel || !name.trim() || !gender || spouseBlocked || busy}
          onPress={() => void submit()}
        >
          {busy ? <ActivityIndicator color="white" /> : <Text className="font-heading text-white">{t("addHeir.cta")}</Text>}
        </Button>
      </View>
    </Sheet>
  )
}
