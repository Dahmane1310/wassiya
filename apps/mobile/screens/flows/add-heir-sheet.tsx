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
import { inputFontClass } from "@/lib/fonts"
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
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
const FIXED_GENDER: Partial<Record<Relationship, Gender>> = {
  father: "male",
  son: "male",
  brother: "male",
  mother: "female",
  daughter: "female",
  sister: "female",
}

/**
 * Add a family member — a 2-step bottom sheet (like add-asset): pick a relationship,
 * then fill the details. Gender is derived from the relationship (spouse = opposite
 * of the owner); siblings also pick a lineage. Persists via `addFamilyMember`.
 */
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
  const [step, setStep] = useState<"rel" | "details">("rel")
  const [rel, setRel] = useState<Relationship | null>(null)
  const [lineage, setLineage] = useState<Lineage>("full")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = rel ? RELS.find((r) => r.key === rel) : null
  const genderFor = (r: Relationship): Gender | null =>
    r === "spouse" ? (ownerGender ? (ownerGender === "male" ? "female" : "male") : null) : (FIXED_GENDER[r] ?? null)
  const gender = rel ? genderFor(rel) : null
  const spouseBlocked = rel === "spouse" && !ownerGender
  const emailInvalid = email.trim() !== "" && !emailOk(email)

  const close = () => {
    setStep("rel")
    setRel(null)
    setLineage("full")
    setName("")
    setEmail("")
    setError(null)
    setBusy(false)
    onClose()
  }

  function pickRel(r: Relationship) {
    setRel(r)
    setStep("details")
  }

  async function submit() {
    if (!rel || !gender || !name.trim() || emailInvalid || busy) return
    setBusy(true)
    setError(null)
    try {
      await add({
        relationship: rel,
        lineage: meta?.lineage ? lineage : undefined,
        gender,
        name,
        contactEmail: email.trim() || undefined,
      })
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader title={t("addHeir.title")} subtitle={t("addHeir.subtitle")} onClose={close} />

      {step === "rel" ? (
        <View className="px-5 pb-3 pt-1">
          <Text className="mb-3 px-1 font-sans-medium text-[13.5px] text-ink-2">
            {t("addHeir.chooseRelationship")}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {RELS.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => pickRel(r.key)}
                style={{ width: "31%" }}
                className="items-center gap-2 rounded-2xl border border-border bg-card py-4 active:opacity-80"
              >
                <r.icon size={22} color={c.goldDeep} strokeWidth={2} />
                <Text className="font-heading text-[12.5px] text-foreground">{t(`heirRel.${r.key}`)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View className="px-5 pb-4 pt-1">
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-surface-2 p-3">
            {meta ? (
              <View className="h-10 w-10 items-center justify-center rounded-[11px] bg-gold-soft">
                <meta.icon size={20} color={c.goldDeep} strokeWidth={2} />
              </View>
            ) : null}
            <Text className="flex-1 font-heading text-[14.5px] text-foreground">
              {rel ? t(`heirRel.${rel}`) : ""}
            </Text>
            <Pressable onPress={() => setStep("rel")} hitSlop={8} className="active:opacity-70">
              <Text className="font-heading text-[13px] text-primary">{t("asset.form.change")}</Text>
            </Pressable>
          </View>

          {meta?.lineage ? (
            <>
              <Text className="mb-2 font-sans-semibold text-[12.5px] text-ink-2">{t("addHeir.lineage")}</Text>
              <View className="mb-4 flex-row gap-2.5">
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

          <Field label={t("addHeir.fullName")}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("addHeir.namePlaceholder")}
              placeholderTextColor={c.ink3}
              autoCapitalize="words"
              className={`h-full flex-1 ${inputFontClass} text-[15.5px] text-foreground`}
            />
          </Field>

          <View className="mt-1">
            <Field label={t("addHeir.email")}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("addHeir.emailPlaceholder")}
                placeholderTextColor={c.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className={`h-full flex-1 ${inputFontClass} text-[15.5px] text-foreground`}
              />
            </Field>
            <Text className="mt-1.5 font-sans-medium text-[12px] leading-[1.4] text-ink-3">
              {t("addHeir.emailHint")}
            </Text>
          </View>

          {spouseBlocked ? (
            <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{t("addHeir.spouseNeedsGender")}</Text>
          ) : null}
          {emailInvalid ? (
            <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{t("addHeir.emailInvalid")}</Text>
          ) : null}
          {error ? <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{error}</Text> : null}

          <View className="mt-4 flex-row items-center gap-2.5 rounded-2xl bg-green-soft p-3.5">
            <Scale size={18} color={c.green} strokeWidth={1.9} />
            <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-green">{t("addHeir.note")}</Text>
          </View>

          <Button
            variant="gold"
            className="mt-5 h-[54px] rounded-2xl"
            disabled={!rel || !name.trim() || !gender || spouseBlocked || emailInvalid || busy}
            onPress={() => void submit()}
          >
            {busy ? <ActivityIndicator color="white" /> : <Text className="font-heading text-white">{t("addHeir.cta")}</Text>}
          </Button>
        </View>
      )}
    </Sheet>
  )
}
