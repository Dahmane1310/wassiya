import { useState } from "react"
import { ActivityIndicator, Alert, Pressable, Share, View } from "react-native"
import { useRouter } from "expo-router"
import { Plus, Send, Trash2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { ScreenContainer } from "@/components/layout/screen-container"
import { Pill } from "@/components/ui/pill"
import { ScreenHeader } from "@/components/ui/screen-header"
import { SectionLabel } from "@/components/ui/section-label"
import { withoutAutoLock } from "@/lib/auto-lock"
import { useThemeColors } from "@/lib/colors"
import { inviteLink } from "@/lib/invite"
import { useContacts } from "@/screens/contacts/hooks/use-contacts"
import { AddContactSheet } from "@/screens/contacts/components/add-contact-sheet"

const initialsFor = (label: string | null, email: string) =>
  (label?.trim() || email).slice(0, 2).toUpperCase()

/** Non-heir beneficiaries — standalone recipients (e.g. a charity for a Wasiyyah
 *  bequest) who can decrypt the vault after release. Heirs are also beneficiaries
 *  but are managed on the Heirs screen and don't appear here. */
export function ContactsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useThemeColors()
  const { beneficiaries, loading, addBeneficiary, removeBeneficiary, invite } = useContacts()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function onInvite(id: string, who: string) {
    try {
      const token = await invite(id as never)
      await withoutAutoLock(() =>
        Share.share({ message: t("contacts.inviteMessage", { who, link: inviteLink(token) }) })
      )
    } catch {
      // Share dismissed / issuance failed — non-fatal.
    }
  }

  function onRemove(id: string, who: string) {
    Alert.alert(t("contacts.removeTitle"), t("contacts.removeBody", { who }), [
      { text: t("contacts.cancel"), style: "cancel" },
      {
        text: t("contacts.remove"),
        style: "destructive",
        onPress: () =>
          void removeBeneficiary(id as never).catch((err: unknown) =>
            Alert.alert(
              t("contacts.remove"),
              err instanceof Error ? err.message : String(err)
            )
          ),
      },
    ])
  }

  return (
    <ScreenContainer scroll edges={["top"]}>
      <View className="flex-1 gap-5 pb-12 pt-1">
        <ScreenHeader
          title={t("contacts.title")}
          subtitle={t("contacts.subtitle")}
          onBack={() => router.back()}
        />

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <View>
              <SectionLabel right={<AddButton onPress={() => setSheetOpen(true)} />}>
                {t("contacts.beneficiaries")}
              </SectionLabel>
              <Group>
                {(beneficiaries ?? []).length === 0 ? (
                  <Empty text={t("contacts.noBeneficiaries")} />
                ) : (
                  (beneficiaries ?? []).map((b, i) => (
                    <ContactRow
                      key={b.id}
                      tint={c.primary}
                      label={b.label}
                      email={b.contactEmail}
                      badge={
                        <Pill tone={b.linked ? "green" : "gold"}>
                          {t(b.linked ? "contacts.joined" : "contacts.invited")}
                        </Pill>
                      }
                      last={i === (beneficiaries ?? []).length - 1}
                      onInvite={() => onInvite(b.id, b.label ?? b.contactEmail)}
                      onRemove={() => onRemove(b.id, b.label ?? b.contactEmail)}
                    />
                  ))
                )}
              </Group>
            </View>

            <Text className="px-1 text-center font-sans-medium text-[11.5px] leading-[1.4] text-ink-3">
              {t("contacts.disclaimer")}
            </Text>
          </>
        )}
      </View>

      <AddContactSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(email, name) => addBeneficiary(email, name)}
      />
    </ScreenContainer>
  )
}

function AddButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Pressable onPress={onPress} hitSlop={8} className="flex-row items-center gap-1 active:opacity-70">
      <Icon as={Plus} size={16} className="text-primary" />
      <Text className="font-heading text-[13px] text-primary">{t("contacts.add")}</Text>
    </Pressable>
  )
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card px-1.5 shadow-sm shadow-black/5">
      {children}
    </View>
  )
}

function Empty({ text }: { text: string }) {
  return <Text className="px-3.5 py-5 font-sans-medium text-[13px] text-ink-3">{text}</Text>
}

function ContactRow({
  tint,
  label,
  email,
  badge,
  last,
  onInvite,
  onRemove,
}: {
  tint: string
  label: string | null
  email: string
  badge: React.ReactNode
  last: boolean
  onInvite: () => void
  onRemove: () => void
}) {
  return (
    <View className={cn("flex-row items-center gap-3 px-3 py-3", !last && "border-b border-line-2")}>
      <View
        style={{ backgroundColor: tint + "29" }}
        className="h-[42px] w-[42px] items-center justify-center rounded-full"
      >
        <Text className="font-heading text-[13px]" style={{ color: tint }}>
          {initialsFor(label, email)}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-heading text-[14.5px] text-foreground">
          {label?.trim() || email}
        </Text>
        {label?.trim() ? (
          <Text numberOfLines={1} className="font-sans-medium text-[12.5px] text-ink-3">
            {email}
          </Text>
        ) : null}
      </View>
      {badge}
      <Pressable onPress={onInvite} hitSlop={6} className="p-1.5 active:opacity-60">
        <Icon as={Send} size={18} className="text-primary" />
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={6} className="p-1.5 active:opacity-60">
        <Icon as={Trash2} size={18} className="text-ink-3" />
      </Pressable>
    </View>
  )
}
