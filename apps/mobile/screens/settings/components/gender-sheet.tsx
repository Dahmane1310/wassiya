import { useState } from "react"
import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { OptionSheet } from "@/components/ui/option-sheet"

/** Owner-gender picker — required by the Fara'id engine to compute the spouse's
 *  share. Persists via `setOwnerGender`; closes once the write settles. */
export function GenderSheet({
  open,
  onClose,
  value,
}: {
  open: boolean
  onClose: () => void
  value: "male" | "female" | null
}) {
  const { t } = useTranslation()
  const setOwnerGender = useMutation(api.users.setOwnerGender)
  const [busy, setBusy] = useState(false)

  return (
    <OptionSheet
      open={open}
      onClose={onClose}
      title={t("profile.ownerGender")}
      subtitle={t("profile.genderSubtitle")}
      selectedKey={value}
      options={(["male", "female"] as const).map((g) => ({
        key: g,
        label: t(`gender.${g}`),
      }))}
      onSelect={(key) => {
        if (busy) return
        setBusy(true)
        void setOwnerGender({ gender: key as "male" | "female" })
          .finally(() => setBusy(false))
        onClose()
      }}
    />
  )
}
