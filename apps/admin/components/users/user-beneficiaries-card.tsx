"use client"

import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

type Beneficiary = {
  _id: string
  contactEmail: string
  status: string
  linked: boolean
  invite: { expiresAt: number; consumedAt: number | null } | null
}

/** Invite-token state derived client-side from raw timestamps (queries must
 *  not read wall-clock). */
function inviteBadge(invite: Beneficiary["invite"], enrolled: boolean, t: TFunction) {
  if (enrolled || invite === null) return null
  if (invite.consumedAt !== null) {
    return <Badge variant="outline">{t("userBeneficiaries.inviteUsed")}</Badge>
  }
  if (invite.expiresAt < Date.now()) {
    return (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-transparent">
        {t("userBeneficiaries.inviteExpired")}
      </Badge>
    )
  }
  return <Badge variant="outline" className="text-muted-foreground">{t("userBeneficiaries.invitePending")}</Badge>
}

export function UserBeneficiariesCard({ beneficiaries }: { beneficiaries: Beneficiary[] }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userBeneficiaries.title")}</CardTitle>
        <span className="text-muted-foreground text-xs tabular-nums">
          {beneficiaries.length}
        </span>
      </CardHeader>
      <CardContent>
        {beneficiaries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("userBeneficiaries.noneYet")}</p>
        ) : (
          <div className="divide-border/50 divide-y">
            {beneficiaries.map((b) => (
              <div key={b._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
                  {b.contactEmail.slice(0, 2)}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {b.contactEmail}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={
                      b.status === "enrolled"
                        ? "border-transparent bg-green-600/10 text-green-700 dark:text-green-400"
                        : "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }
                  >
                    {t(`userBeneficiaries.${b.status}`, { defaultValue: b.status })}
                  </Badge>
                  {inviteBadge(b.invite, b.status === "enrolled", t)}
                  {b.linked && <Badge variant="outline">{t("userBeneficiaries.signedUp")}</Badge>}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
