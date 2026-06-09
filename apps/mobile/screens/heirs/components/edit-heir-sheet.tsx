import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, TextInput, View } from "react-native"
import { Send } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { Pill } from "@/components/ui/pill"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useInvite } from "@/hooks/use-invite"
import { useThemeColors } from "@/lib/colors"
import { inputFontClass } from "@/lib/fonts"
import { type DecryptedHeir } from "@/screens/heirs/hooks/use-decrypted-heirs"

const emailOk = (e: string) => e.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

/** Tap an heir → manage them here: edit name, add/update an email (which links them
 *  as a beneficiary), mark living/deceased, invite them if they haven't joined, or
 *  remove them. Replaces the old tap-to-toggle-death on the family tree. */
export function EditHeirSheet({
  open,
  onClose,
  heir,
  relLabel,
  update,
  remove,
}: {
  open: boolean
  onClose: () => void
  heir: DecryptedHeir | null
  relLabel: (h: DecryptedHeir) => string
  update: (
    id: Id<"familyMembers">,
    patch: { name?: string; contactEmail?: string; isAlive?: boolean }
  ) => Promise<void>
  remove: (id: Id<"familyMembers">) => Promise<void>
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const { sendInvite } = useInvite()
  const beneficiaryRows = useQuery(api.beneficiaries.listBeneficiaries)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [living, setLiving] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const benef = heir?.linkedBeneficiaryId
    ? (beneficiaryRows ?? []).find((b) => b._id === heir.linkedBeneficiaryId)
    : undefined
  const joined = benef?.linkedUserId != null

  // Prefill whenever the sheet opens for an heir. (listBeneficiaries is already
  // cached by the Heirs screen, so the linked email resolves on open.)
  useEffect(() => {
    if (!open || !heir) return
    setName(heir.name ?? "")
    setEmail(benef?.contactEmail ?? "")
    setLiving(heir.isAlive)
    setError(null)
    setBusy(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, heir?.id])

  if (!heir) return null
  const emailInvalid = !emailOk(email)
  const who = name.trim() || relLabel(heir)

  async function save() {
    if (!heir || emailInvalid || busy) return
    setBusy(true)
    setError(null)
    try {
      await update(heir.id, { name, contactEmail: email.trim() || undefined, isAlive: living })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  async function onInvite() {
    if (!heir?.linkedBeneficiaryId) return
    try {
      await sendInvite(heir.linkedBeneficiaryId, who)
    } catch {
      // Share dismissed / issuance failed — non-fatal.
    }
  }

  function onRemove() {
    if (!heir) return
    const id = heir.id
    Alert.alert(t("editHeir.removeTitle"), t("editHeir.removeBody", { who }), [
      { text: t("contacts.cancel"), style: "cancel" },
      {
        text: t("editHeir.remove"),
        style: "destructive",
        onPress: () =>
          void remove(id)
            .then(onClose)
            .catch((e: unknown) =>
              Alert.alert(
                t("editHeir.remove"),
                e instanceof Error && e.message.includes("HAS_WASIYYAH_ALLOCATION")
                  ? t("contacts.cantRemoveBeneficiary")
                  : e instanceof Error
                    ? e.message
                    : String(e)
              )
            ),
      },
    ])
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={t("editHeir.title")} subtitle={relLabel(heir)} onClose={onClose} />
      <View className="gap-4 px-5 pb-6 pt-1">
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

        <View>
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
          <Text
            className={cn(
              "mt-1.5 font-sans-medium text-[12px] leading-[1.4]",
              emailInvalid ? "text-danger" : "text-ink-3"
            )}
          >
            {emailInvalid ? t("addHeir.emailInvalid") : t("editHeir.emailHint")}
          </Text>
        </View>

        <View>
          <Text className="mb-2 font-sans-semibold text-[12.5px] text-ink-2">{t("editHeir.status")}</Text>
          <View className="flex-row gap-2.5">
            {([true, false] as const).map((v) => {
              const on = living === v
              return (
                <Pressable
                  key={String(v)}
                  onPress={() => setLiving(v)}
                  className={cn(
                    "flex-1 items-center rounded-2xl border py-3 active:opacity-80",
                    on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                  )}
                >
                  <Text className={cn("font-heading text-[13.5px]", on ? "text-gold-deep" : "text-foreground")}>
                    {t(v ? "editHeir.living" : "editHeir.deceased")}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card p-3.5">
          {heir.linkedBeneficiaryId ? (
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heading text-[13.5px] text-foreground">{t("editHeir.access")}</Text>
                <Text className="font-sans-medium text-[12px] text-ink-3">
                  {t(joined ? "contacts.joined" : "contacts.invited")}
                </Text>
              </View>
              {joined ? (
                <Pill tone="green">{t("contacts.joined")}</Pill>
              ) : (
                <Button
                  variant="outline"
                  className="h-[40px] flex-row gap-1.5 rounded-xl px-4"
                  onPress={() => void onInvite()}
                >
                  <Icon as={Send} size={16} className="text-primary" />
                  <Text className="font-heading text-[13px] text-primary">{t("heirs.invite")}</Text>
                </Button>
              )}
            </View>
          ) : (
            <Text className="font-sans-medium text-[12.5px] leading-[1.4] text-ink-3">
              {t("editHeir.addEmailToInvite")}
            </Text>
          )}
        </View>

        {error ? <Text className="font-sans-medium text-[12.5px] text-danger">{error}</Text> : null}

        <Button
          variant="gold"
          className="h-[54px] rounded-2xl"
          disabled={emailInvalid || busy}
          onPress={() => void save()}
        >
          {busy ? <ActivityIndicator color="white" /> : <Text className="font-heading text-white">{t("editHeir.save")}</Text>}
        </Button>

        <Pressable onPress={onRemove} className="items-center py-1 active:opacity-70">
          <Text className="font-heading text-[13px] text-danger">{t("editHeir.remove")}</Text>
        </Pressable>
      </View>
    </Sheet>
  )
}
