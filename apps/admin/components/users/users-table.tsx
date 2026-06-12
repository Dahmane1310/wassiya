"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { usePaginatedQuery, useQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { DeleteProvisionedButton } from "@/components/users/delete-provisioned-button"
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
  /** "invited" = admin-created account, no vault yet; otherwise a real owner row. */
  stage: "invited" | "onboarding" | "active"
  switchState: string | null
  entitlement: { plan: string; status: string } | null
  disabled: boolean
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
          <div className="flex items-center gap-2 font-medium">
            {row.original.email ?? t("users.unknownEmail")}
            {row.original.disabled && (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive border-transparent">
                {t("users.disabledBadge")}
              </Badge>
            )}
          </div>
          {row.original.name !== null && (
            <div className="text-muted-foreground text-xs">{row.original.name}</div>
          )}
        </div>
      ),
    },
    {
      id: "stage",
      meta: { label: t("users.colStage") },
      accessorFn: (u) => u.stage,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colStage")} />,
      cell: ({ row }) =>
        row.original.stage === "invited" ? (
          <Badge variant="secondary" className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
            {t("users.stageInvited")}
          </Badge>
        ) : row.original.stage === "active" ? (
          <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">
            {t("users.vaultSetUp")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t("users.stageOnboarding")}
          </Badge>
        ),
    },
    {
      id: "switch",
      meta: { label: t("users.colSwitch") },
      accessorFn: (u) => u.switchState ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colSwitch")} />,
      cell: ({ row }) =>
        row.original.stage === "invited" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <StateBadge state={row.original.switchState} />
        ),
    },
    {
      id: "entitlement",
      meta: { label: t("users.colEntitlement") },
      accessorFn: (u) =>
        u.entitlement === null ? "" : `${u.entitlement.plan} ${u.entitlement.status}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("users.colEntitlement")} />,
      cell: ({ row }) =>
        row.original.entitlement === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
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
    {
      id: "actions",
      meta: { label: t("users.colActions") },
      enableSorting: false,
      header: () => null,
      cell: ({ row }) =>
        row.original.stage === "invited" ? (
          <span onClick={(e) => e.stopPropagation()}>
            <DeleteProvisionedButton
              ownerId={subjectOf(row.original.tokenIdentifier)}
              email={row.original.email}
            />
          </span>
        ) : null,
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
  // Admin-created accounts awaiting vault setup have no `users` row, so they
  // can't come from the paginated query — merge them in by creation time.
  const provisioned = useQuery(api.admin.users.listProvisionedAccounts)

  const rows = useMemo<UserRow[]>(() => {
    const owners: UserRow[] = results.map((u) => ({
      tokenIdentifier: u.tokenIdentifier,
      _creationTime: u._creationTime,
      email: u.email,
      name: u.name,
      stage: u.onboardingComplete ? "active" : "onboarding",
      switchState: u.switchState,
      entitlement: u.entitlement,
      disabled: u.disabled,
    }))
    const invited: UserRow[] = (provisioned ?? []).map((p) => ({
      tokenIdentifier: p.accountId,
      _creationTime: p.createdAt,
      email: p.email,
      name: p.name,
      stage: "invited",
      switchState: null,
      entitlement: null,
      disabled: false,
    }))
    return [...owners, ...invited].sort((a, b) =>
      order === "desc"
        ? b._creationTime - a._creationTime
        : a._creationTime - b._creationTime,
    )
  }, [results, provisioned, order])

  return (
    <DataTable
      columns={columns}
      data={rows}
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
