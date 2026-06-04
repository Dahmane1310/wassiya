import { Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/layout/empty-state"
import { ScreenContainer } from "@/components/layout/screen-container"

/** The People tab: beneficiaries, family/heirs, and executors. Empty for now —
 *  invitations, the family-tree graph, and Fara'id heirs land here. */
export function PeopleScreen() {
  const { t } = useTranslation()

  return (
    <ScreenContainer edges={["top"]}>
      <EmptyState
        icon={Users}
        title={t("people.emptyTitle")}
        body={t("people.emptyBody")}
      />
    </ScreenContainer>
  )
}
