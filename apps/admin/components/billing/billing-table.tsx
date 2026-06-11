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
import { type Order } from "@/components/shared/order"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"

type BillingRow = {
  _id: string
  _creationTime: number
  ownerId: string | null
  ownerEmail: string | null
  source: string
  type: string
  plan: string | null
  externalEventId: string | null
  meta: Record<string, string> | null
}

function buildColumns(t: TFunction): ColumnDef<BillingRow>[] {
  return [
    {
      id: "when",
      meta: { label: t("billing.colWhen") },
      accessorFn: (e) => e._creationTime,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("billing.colWhen")} />,
      cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
    },
    {
      id: "owner",
      meta: { label: t("billing.colOwner") },
      accessorFn: (e) => e.ownerEmail ?? e.ownerId ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("billing.colOwner")} />,
      cell: ({ row }) =>
        row.original.ownerId !== null ? (
          <OwnerRef ownerId={row.original.ownerId} email={row.original.ownerEmail} />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "type",
      meta: { label: t("billing.colEvent") },
      accessorFn: (e) => e.type,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("billing.colEvent")} />,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.type.replaceAll("_", " ")}</Badge>
      ),
    },
    {
      id: "plan",
      meta: { label: t("billing.colPlan") },
      accessorFn: (e) => e.plan ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("billing.colPlan")} />,
      cell: ({ row }) =>
        row.original.plan !== null ? (
          <Badge variant="secondary" className="capitalize">{t(`plans.${row.original.plan}`, { defaultValue: row.original.plan })}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "source",
      meta: { label: t("billing.colSource") },
      accessorFn: (e) => e.source,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("billing.colSource")} />,
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.source}</span>,
    },
    {
      id: "details",
      meta: { label: t("billing.colDetails") },
      enableSorting: false,
      header: t("billing.colDetails"),
      cell: ({ row }) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {row.original.meta !== null &&
            Object.entries(row.original.meta).map(([k, v]) => (
              <span key={k} className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px]">
                {k}={v}
              </span>
            ))}
        </div>
      ),
    },
  ]
}

export function BillingTable({
  ownerId,
  toolbar,
}: {
  ownerId?: string
  toolbar?: React.ReactNode
}) {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const [order, setOrder] = useState<Order>("desc")
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.billing.listBillingEvents,
    { ownerId: ownerId?.trim() || undefined, order },
    { initialNumItems: 50 },
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      exportName="billing"
      toolbar={toolbar}
      loading={status === "LoadingFirstPage"}
      server={{ status, loadMore }}
      serverSort={{ columnId: "when", onChange: setOrder }}
    />
  )
}
