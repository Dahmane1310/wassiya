"use client"

import { useMemo, useState } from "react"
import { usePaginatedQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { EntitlementBadge } from "@/components/shared/entitlement-badge"
import { type Order } from "@/components/shared/order"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"

export type EntitlementStatus = "trialing" | "active" | "past_due" | "canceled" | "expired"
export type EntitlementPlan = "trial" | "annual" | "lifetime"

type EntitlementRow = {
  _id: string
  _creationTime: number
  ownerId: string
  email: string | null
  plan: string
  status: string
  source: string
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: boolean
}

function buildColumns(t: TFunction): ColumnDef<EntitlementRow>[] {
  return [
    {
      id: "owner",
      meta: { label: t("entitlements.colOwner") },
      accessorFn: (e) => e.email ?? e.ownerId,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("entitlements.colOwner")} />,
      cell: ({ row }) => (
        <OwnerRef ownerId={row.original.ownerId} email={row.original.email} />
      ),
    },
    {
      id: "plan",
      meta: { label: t("entitlements.colPlan") },
      accessorFn: (e) => `${e.plan} ${e.status}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("entitlements.colPlan")} />,
      cell: ({ row }) => (
        <EntitlementBadge plan={row.original.plan} status={row.original.status} />
      ),
    },
    {
      id: "source",
      meta: { label: t("entitlements.colSource") },
      accessorFn: (e) => e.source,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("entitlements.colSource")} />,
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">{row.original.source}</Badge>
      ),
    },
    {
      id: "accessEnds",
      meta: { label: t("entitlements.colAccessEnds") },
      accessorFn: (e) => e.currentPeriodEnd ?? Number.MAX_SAFE_INTEGER,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("entitlements.colAccessEnds")} />,
      cell: ({ row }) =>
        row.original.plan === "lifetime" ? (
          <span className="text-muted-foreground text-sm">{t("common.never")}</span>
        ) : (
          <TimeCell ts={row.original.currentPeriodEnd} />
        ),
    },
    {
      id: "created",
      meta: { label: t("entitlements.colCreated") },
      accessorFn: (e) => e._creationTime,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("entitlements.colCreated")} />,
      cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
    },
  ]
}

type Props = {
  status?: EntitlementStatus
  plan?: EntitlementPlan
  ownerId?: string
  toolbar?: React.ReactNode
}

export function EntitlementsTable({ status, plan, ownerId, toolbar }: Props) {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const [order, setOrder] = useState<Order>("desc")
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.admin.entitlements.listEntitlements,
    { status, plan, ownerId: ownerId?.trim() || undefined, order },
    { initialNumItems: 50 },
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      exportName="entitlements"
      toolbar={toolbar}
      loading={pageStatus === "LoadingFirstPage"}
      server={{ status: pageStatus, loadMore }}
      serverSort={{ columnId: "created", onChange: setOrder }}
    />
  )
}
