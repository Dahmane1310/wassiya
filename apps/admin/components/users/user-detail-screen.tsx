"use client"

import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { UserAuditCard } from "./user-audit-card"
import { UserBeneficiariesCard } from "./user-beneficiaries-card"
import { UserBillingCard } from "./user-billing-card"
import { UserDeathCaseCard } from "./user-death-case-card"
import { UserEntitlementCard } from "./user-entitlement-card"
import { UserIdentityCard } from "./user-identity-card"
import { UserSwitchCard } from "./user-switch-card"
import { UserVaultCard } from "./user-vault-card"

export function UserDetailScreen({ tokenIdentifier }: { tokenIdentifier: string }) {
  const { t } = useTranslation()
  const detail = useQuery(api.admin.userDetail.getUserDetail, { tokenIdentifier })

  if (detail === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Skeleton className="h-[88px] w-full rounded-2xl" />
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <Skeleton className="h-72 w-full rounded-2xl lg:col-span-3" />
          <Skeleton className="h-72 w-full rounded-2xl lg:col-span-2" />
        </div>
      </div>
    )
  }
  if (detail === null) {
    return (
      <Empty className="rounded-2xl border">
        <EmptyTitle>{t("users.notFoundTitle")}</EmptyTitle>
        <EmptyDescription>{t("users.notFoundBody")}</EmptyDescription>
      </Empty>
    )
  }

  const ownerId = detail.identity.tokenIdentifier

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <UserIdentityCard identity={detail.identity} appUser={detail.appUser} />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <UserSwitchCard ownerId={ownerId} sw={detail.switch} />
          <UserBeneficiariesCard beneficiaries={detail.beneficiaries} />
          <UserAuditCard ownerId={ownerId} entries={detail.recentAudit} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <UserEntitlementCard ownerId={ownerId} ent={detail.entitlement} />
          <UserVaultCard counts={detail.counts} />
          <UserDeathCaseCard deathCase={detail.deathCase} />
          <UserBillingCard ownerId={ownerId} />
        </div>
      </div>
    </div>
  )
}
