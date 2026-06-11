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
import { CountStat } from "@/components/shared/count-stat"
import { EstateDialog } from "./estate-dialog"

type ReleasedRow = {
  ownerId: string
  ownerEmail: string | null
  releasedAt: number | null
  shareCount: { value: number; capped: boolean }
}

function buildColumns(t: TFunction): ColumnDef<ReleasedRow>[] {
  return [
    {
      id: "owner",
      meta: { label: t("releases.colOwner") },
      accessorFn: (r) => r.ownerEmail ?? r.ownerId,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colOwner")} />,
      cell: ({ row }) => (
        <span onClick={(e) => e.stopPropagation()}>
          <OwnerRef ownerId={row.original.ownerId} email={row.original.ownerEmail} />
        </span>
      ),
    },
    {
      id: "released",
      meta: { label: t("releases.colReleased") },
      accessorFn: (r) => r.releasedAt ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colReleased")} />,
      cell: ({ row }) => <TimeCell ts={row.original.releasedAt} />,
    },
    {
      id: "shares",
      meta: { label: t("releases.colShares") },
      accessorFn: (r) => r.shareCount.value,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colShares")} />,
      cell: ({ row }) => (
        <span className="tabular-nums">
          <CountStat count={row.original.shareCount} />
        </span>
      ),
    },
  ]
}

export function ReleasedTable() {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const [order, setOrder] = useState<Order>("desc")
  const [open, setOpen] = useState<string | null>(null)
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.estates.listReleased,
    { order },
    { initialNumItems: 50 },
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={results}
        labels={labels}
        viewOptions
        loading={status === "LoadingFirstPage"}
        server={{ status, loadMore }}
        serverSort={{ columnId: "released", onChange: setOrder }}
        onRowClick={(r) => setOpen(r.ownerId)}
      />
      {open !== null && <EstateDialog ownerId={open} onClose={() => setOpen(null)} />}
    </>
  )
}
