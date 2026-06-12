"use client"

import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { UserAuditCard } from "./user-audit-card"
import { UserBeneficiariesCard } from "./user-beneficiaries-card"
import { UserBillingCard } from "./user-billing-card"
import { UserDeathCaseCard } from "./user-death-case-card"
import { UserEntitlementCard } from "./user-entitlement-card"
import { UserGlanceStrip } from "./user-glance-strip"
import { UserIdentityCard } from "./user-identity-card"
import { UserSwitchCard } from "./user-switch-card"

export function UserDetailScreen({ tokenIdentifier }: { tokenIdentifier: string }) {
  const { t } = useTranslation()
  const detail = useQuery(api.admin.userDetail.getUserDetail, { tokenIdentifier })

  if (detail === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Skeleton className="h-[88px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton className="h-[76px] rounded-xl" />
          <Skeleton className="h-[76px] rounded-xl" />
          <Skeleton className="h-[76px] rounded-xl" />
          <Skeleton className="h-[76px] rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
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
  const urgentDeathCase = detail.deathCase?.status === "under_review"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <UserIdentityCard
        identity={detail.identity}
        appUser={detail.appUser}
        disabled={detail.disabled}
      />
      <UserGlanceStrip
        switchState={detail.switch?.state ?? null}
        entitlement={detail.entitlement}
        counts={detail.counts}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            {t("users.tabOverview")}
            {urgentDeathCase && (
              <span className="bg-amber-500 ms-1 size-2 rounded-full" aria-hidden />
            )}
          </TabsTrigger>
          <TabsTrigger value="people">
            {t("users.tabPeople")}
            <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[11px] tabular-nums">
              {detail.beneficiaries.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="billing">{t("users.tabBilling")}</TabsTrigger>
          <TabsTrigger value="activity">{t("users.tabActivity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 flex flex-col gap-4">
          {/* The urgent thing reads first when a death case is open. */}
          {urgentDeathCase && <UserDeathCaseCard deathCase={detail.deathCase} />}
          <UserSwitchCard ownerId={ownerId} sw={detail.switch} />
          {!urgentDeathCase && <UserDeathCaseCard deathCase={detail.deathCase} />}
        </TabsContent>

        <TabsContent value="people" className="mt-3">
          <UserBeneficiariesCard beneficiaries={detail.beneficiaries} />
        </TabsContent>

        <TabsContent value="billing" className="mt-3">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <UserEntitlementCard ownerId={ownerId} ent={detail.entitlement} />
            <UserBillingCard ownerId={ownerId} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-3">
          <UserAuditCard ownerId={ownerId} entries={detail.recentAudit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
