"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { subjectOf } from "@/lib/owner-id"
import { StateBadge } from "@/components/shared/state-badge"
import { TimeCell } from "@/components/shared/time-cell"

type UserRow = {
  tokenIdentifier: string
  _creationTime: number
  email: string | null
  name: string | null
  onboardingComplete: boolean
  switchState: string | null
  entitlement: { plan: string; status: string }
}

function buildColumns(t: TFunction): ColumnDef<UserRow>[] {
  return [
    {
      id: "user",
      meta: { label: t("users.colUser") },
      accessorFn: (u) => u.email ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colUser")} />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.email ?? t("users.unknownEmail")}</div>
          {row.original.name !== null && (
            <div className="text-muted-foreground text-xs">{row.original.name}</div>
          )}
        </div>
      ),
    },
    {
      id: "onboarded",
      meta: { label: t("users.colOnboarded") },
      accessorFn: (u) => u.onboardingComplete,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colOnboarded")} />,
      cell: ({ row }) =>
        row.original.onboardingComplete ? (
          <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">{t("common.yes")}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">{t("common.no")}</Badge>
        ),
    },
    {
      id: "switch",
      meta: { label: t("users.colSwitch") },
      accessorFn: (u) => u.switchState ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colSwitch")} />,
      cell: ({ row }) => <StateBadge state={row.original.switchState} />,
    },
    {
      id: "entitlement",
      meta: { label: t("users.colEntitlement") },
      accessorFn: (u) => `${u.entitlement.plan} ${u.entitlement.status}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colEntitlement")} />,
      cell: ({ row }) => (
        <EntitlementBadge
          plan={row.original.entitlement.plan}
          status={row.original.entitlement.status}
        />
      ),
    },
    {
      id: "joined",
      meta: { label: t("users.colJoined") },
      accessorFn: (u) => u._creationTime,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colJoined")} />,
      cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
    },
  ]
}

export function UsersTable({ toolbar }: { toolbar?: React.ReactNode }) {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const router = useRouter()
  const [order, setOrder] = useState<Order>("desc")
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.users.listUsers,
    { order },
    { initialNumItems: 50 },
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      exportName="users"
      toolbar={toolbar}
      loading={status === "LoadingFirstPage"}
      server={{ status, loadMore }}
      serverSort={{ columnId: "joined", onChange: setOrder }}
      onRowClick={(u) => router.push(`/users/${subjectOf(u.tokenIdentifier)}`)}
    />
  )
}
