import { useState } from "react"
import { ActivityIndicator, Pressable, View } from "react-native"
import { ChevronRight, UserPlus } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"
import { Fab } from "@/components/ui/fab"
import { Pill } from "@/components/ui/pill"
import { ScreenHeader } from "@/components/ui/screen-header"
import { SectionLabel } from "@/components/ui/section-label"
import { useContacts, type Beneficiary } from "@/screens/contacts/hooks/use-contacts"
import { AddContactSheet } from "@/screens/contacts/components/add-contact-sheet"
import { ManageContactSheet } from "@/screens/contacts/components/manage-contact-sheet"

const initialsFor = (label: string | null, email: string) =>
  (label?.trim() || email).slice(0, 2).toUpperCase()

/** Non-heir beneficiaries — standalone recipients (e.g. a charity for a Wasiyyah
 *  bequest) who can open the vault after release. Heirs are also beneficiaries but
 *  are managed on the Heirs screen and don't appear here. Matches the app's list
 *  pattern: FAB to add, tap a row to manage (invite / remove). */
export function ContactsScreen() {
  const { t } = useTranslation()
  const { beneficiaries, loading, addBeneficiary, removeBeneficiary } = useContacts()
  const [addOpen, setAddOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)

  const list = beneficiaries ?? []
  const active = list.find((b) => b.id === manageId) ?? null

  // Render the ScreenContainer + header + sheets ONCE; only the inner content
  // swaps between loading / empty / list. (Mounting a sheet inside a branch that
  // unmounts on empty→non-empty orphans the native sheet — see the Heirs screen.)
  function renderContent() {
    if (loading) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator />
        </View>
      )
    }

    if (list.length === 0) {
      return <EmptyState icon={UserPlus} title={t("contacts.emptyTitle")} body={t("contacts.emptyBody")} />
    }

    return (
      <View className="gap-2.5">
        <SectionLabel
          right={
            <Text className="font-heading text-[12.5px] text-ink-3">
              {t("wasiyyah.nRecipients", { count: list.length })}
            </Text>
          }
        >
          {t("contacts.beneficiaries")}
        </SectionLabel>

        <View className="overflow-hidden rounded-2xl border border-border bg-card px-1.5 shadow-sm shadow-black/5">
          {list.map((b, i) => (
            <RecipientRow key={b.id} b={b} last={i === list.length - 1} onPress={() => setManageId(b.id)} />
          ))}
        </View>

        <Text className="px-1 pt-1 text-center font-sans-medium text-[11.5px] leading-[1.4] text-ink-3">
          {t("contacts.disclaimer")}
        </Text>
      </View>
    )
  }

  return (
    <ScreenContainer
      scroll
      edges={["top"]}
      fab={<Fab onPress={() => setAddOpen(true)} label={t("contacts.add")} />}
    >
      <View className="flex-1 gap-5 pb-6 pt-1">
        <ScreenHeader title={t("contacts.title")} subtitle={t("contacts.subtitle")} />
        {renderContent()}
      </View>

      <AddContactSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(email, name) => addBeneficiary(email, name)}
      />
      <ManageContactSheet
        open={manageId !== null}
        onClose={() => setManageId(null)}
        recipient={active}
        onRemove={removeBeneficiary}
      />
    </ScreenContainer>
  )
}

function RecipientRow({ b, last, onPress }: { b: Beneficiary; last: boolean; onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 px-3 py-3.5 active:opacity-70",
        !last && "border-b border-line-2"
      )}
    >
      <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-gold-soft">
        <Text className="font-heading text-[13px] text-gold-deep">
          {initialsFor(b.label, b.contactEmail)}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-heading text-[14.5px] text-foreground">
          {b.label?.trim() || b.contactEmail}
        </Text>
        {b.label?.trim() ? (
          <Text numberOfLines={1} className="font-sans-medium text-[12.5px] text-ink-3">
            {b.contactEmail}
          </Text>
        ) : null}
      </View>
      <Pill tone={b.linked ? "green" : "gold"}>
        {t(b.linked ? "contacts.joined" : "contacts.invited")}
      </Pill>
      <Icon as={ChevronRight} size={18} className="text-ink-3" />
    </Pressable>
  )
}
