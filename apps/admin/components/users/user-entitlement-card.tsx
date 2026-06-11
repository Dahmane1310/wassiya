"use client"

import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { EntitlementBadge } from "@/components/shared/entitlement-badge"
import { TimeCell } from "@/components/shared/time-cell"
import { GrantDialog } from "@/components/entitlements/grant-dialog"
import { RevokeDialog } from "@/components/entitlements/revoke-dialog"
import { DetailRow } from "./detail-row"

type Ent = {
  plan: string
  status: string
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: boolean
  persisted: boolean
}

export function UserEntitlementCard({ ownerId, ent }: { ownerId: string; ent: Ent }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userPlan.title")}</CardTitle>
        <EntitlementBadge plan={ent.plan} status={ent.status} />
      </CardHeader>
      <CardContent>
        <DetailRow label={ent.plan === "lifetime" ? t("userPlan.expires") : t("userPlan.accessEnds")}>
          {ent.plan === "lifetime" ? t("common.never") : <TimeCell ts={ent.currentPeriodEnd} />}
        </DetailRow>
        {!ent.persisted && (
          <p className="text-muted-foreground mt-2 text-xs">
            {t("userPlan.implicitTrial")}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t pt-4!">
        <GrantDialog ownerId={ownerId} />
        {ent.persisted && <RevokeDialog ownerId={ownerId} />}
      </CardFooter>
    </Card>
  )
}
