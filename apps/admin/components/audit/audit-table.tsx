"use client"

import { useMemo, useState } from "react"
import { usePaginatedQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { type Order } from "@/components/shared/order"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"
import { EventBadge } from "./event-badge"

type AuditRow = {
  _id: string
  _creationTime: number
  ownerId: string
  actor: string
  event: string
  targetTable: string | null
  targetId: string | null
  meta: Record<string, string> | null
}

function Actor({ actor }: { actor: string }) {
  if (actor.startsWith("admin:")) {
    return (
      <span className="text-primary font-mono text-xs font-medium">
        admin:{actor.slice(6).split("|").pop()}
      </span>
    )
  }
  if (actor.startsWith("system")) {
    return <span className="text-muted-foreground font-mono text-xs">{actor}</span>
  }
  return <span className="font-mono text-xs">{actor.split("|").pop()}</span>
}

function buildColumns(t: TFunction): ColumnDef<AuditRow>[] {
  return [
  {
    id: "when",
    meta: { label: t("audit.colWhen") },
    accessorFn: (a) => a._creationTime,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("audit.colWhen")} />,
    cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
  },
  {
    id: "event",
    meta: { label: t("audit.colEvent") },
    accessorFn: (a) => a.event,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("audit.colEvent")} />,
    cell: ({ row }) => <EventBadge event={row.original.event} />,
  },
  {
    id: "actor",
    meta: { label: t("audit.colActor") },
    accessorFn: (a) => a.actor,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("audit.colActor")} />,
    cell: ({ row }) => <Actor actor={row.original.actor} />,
  },
  {
    id: "owner",
    meta: { label: t("audit.colOwner") },
    accessorFn: (a) => a.ownerId,
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("audit.colOwner")} />,
    cell: ({ row }) => <OwnerRef ownerId={row.original.ownerId} />,
  },
  {
    id: "details",
    meta: { label: t("audit.colDetails") },
    enableSorting: false,
    header: t("audit.colDetails"),
    cell: ({ row }) => (
      <div className="flex max-w-72 flex-wrap gap-1">
        {row.original.meta !== null &&
          Object.entries(row.original.meta).map(([k, v]) => (
            <span
              key={k}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px]"
            >
              {k}={v}
            </span>
          ))}
      </div>
    ),
  },
  ]
}

type Props = {
  ownerId?: string
  event?: string
  from?: number
  to?: number
  toolbar?: React.ReactNode
}

export function AuditTable({ ownerId, event, from, to, toolbar }: Props) {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const [order, setOrder] = useState<Order>("desc")
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.auditLog.listAuditLog,
    { ownerId: ownerId || undefined, event: event || undefined, from, to, order },
    { initialNumItems: 100 },
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      exportName="audit-log"
      pageSize={50}
      toolbar={toolbar}
      loading={status === "LoadingFirstPage"}
      server={{ status, loadMore }}
      serverSort={{ columnId: "when", onChange: setOrder }}
    />
  )
}
