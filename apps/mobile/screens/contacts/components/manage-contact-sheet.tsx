import { Alert, Pressable, View } from "react-native"
import { Send } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Pill } from "@/components/ui/pill"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useInvite } from "@/hooks/use-invite"
import { type Beneficiary } from "@/screens/contacts/hooks/use-contacts"

/** Tap a recipient → manage them here: see whether they've joined, (re)send their
 *  invite link, or remove them. Mirrors the Heirs edit sheet so the People area
 *  feels like one app. Recipient name/email are set at add-time (not edited here). */
export function ManageContactSheet({
  open,
  onClose,
  recipient,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  recipient: Beneficiary | null
  onRemove: (id: Id<"beneficiaries">) => Promise<void>
}) {
  const { t } = useTranslation()
  const { sendInvite } = useInvite()

  if (!recipient) return null
  const who = recipient.label?.trim() || recipient.contactEmail
  const joined = recipient.linked

  async function onInvite() {
    if (!recipient) return
    try {
      await sendInvite(recipient.id, who)
    } catch {
      // Share dismissed / issuance failed — non-fatal.
    }
  }

  function confirmRemove() {
    if (!recipient) return
    const id = recipient.id
    Alert.alert(t("contacts.removeTitle"), t("contacts.removeBody", { who }), [
      { text: t("contacts.cancel"), style: "cancel" },
      {
        text: t("contacts.remove"),
        style: "destructive",
        onPress: () =>
          void onRemove(id)
            .then(onClose)
            .catch((e: unknown) =>
              Alert.alert(t("contacts.remove"), e instanceof Error ? e.message : String(e))
            ),
      },
    ])
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title={who}
        subtitle={recipient.label?.trim() ? recipient.contactEmail : undefined}
        onClose={onClose}
      />
      <View className="gap-4 px-5 pb-6 pt-1">
        <View className="rounded-2xl border border-border bg-card p-3.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-heading text-[13.5px] text-foreground">{t("contacts.access")}</Text>
              <Text className="mt-0.5 font-sans-medium text-[12px] leading-[1.4] text-ink-3">
                {t(joined ? "contacts.joinedNote" : "contacts.invitePrompt")}
              </Text>
            </View>
            {joined ? <Pill tone="green">{t("contacts.joined")}</Pill> : null}
          </View>
          {!joined ? (
            <Button
              variant="outline"
              className="mt-3 h-[44px] flex-row gap-1.5 rounded-xl"
              onPress={() => void onInvite()}
            >
              <Icon as={Send} size={16} className="text-primary" />
              <Text className="font-heading text-[13.5px] text-primary">{t("contacts.sendInvite")}</Text>
            </Button>
          ) : null}
        </View>

        <Pressable onPress={confirmRemove} className="items-center py-1 active:opacity-70">
          <Text className="font-heading text-[13px] text-danger">{t("contacts.remove")}</Text>
        </Pressable>
      </View>
    </Sheet>
  )
}
