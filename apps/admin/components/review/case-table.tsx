"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { usePaginatedQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { type Order } from "@/components/shared/order"
import { OwnerRef } from "@/components/shared/owner-ref"
import { StateBadge } from "@/components/shared/state-badge"
import { TimeCell } from "@/components/shared/time-cell"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { aliveSignal, type DeathCase } from "./death-case"

type Status = "under_review" | "approved" | "rejected"

function buildColumns(decided: boolean, t: TFunction): ColumnDef<DeathCase>[] {
  return [
    {
      id: "submitted",
      meta: { label: t("review.colSubmitted") },
      accessorFn: (c) => c.submittedAt,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("review.colSubmitted")} />
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          <TimeCell ts={row.original.submittedAt} />
          {aliveSignal(row.original) && (
            <TriangleAlert
              className="size-3.5 text-amber-600 dark:text-amber-400"
              aria-label={t("review.aliveSignal")}
            />
          )}
        </span>
      ),
    },
    {
      id: "owner",
      meta: { label: t("review.colOwner") },
      accessorFn: (c) => c.ownerEmail ?? c.ownerId,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("review.colOwner")} />
      ),
      cell: ({ row }) => (
        <span onClick={(e) => e.stopPropagation()}>
          <OwnerRef ownerId={row.original.ownerId} email={row.original.ownerEmail} />
        </span>
      ),
    },
    {
      id: "reportedBy",
      meta: { label: t("review.colReportedBy") },
      accessorFn: (c) => c.submittedByEmail ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("review.colReportedBy")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.submittedByEmail ?? "—"}
        </span>
      ),
    },
    {
      id: "switch",
      meta: { label: t("review.colSwitch") },
      accessorFn: (c) => c.switchState ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("review.colSwitch")} />
      ),
      cell: ({ row }) => <StateBadge state={row.original.switchState} />,
    },
    ...(decided
      ? [
          {
            id: "decided",
            meta: { label: t("review.colDecided") },
            accessorFn: (c) => c.reviewedAt ?? 0,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t("review.colDecided")} />
            ),
            cell: ({ row }) => <TimeCell ts={row.original.reviewedAt} />,
          } satisfies ColumnDef<DeathCase>,
        ]
      : []),
    {
      id: "certificate",
      meta: { label: t("review.colCertificate") },
      accessorFn: (c) => c.hasCertificate,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("review.colCertificate")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.hasCertificate ? t("review.certAttached") : t("review.certNone")}
        </span>
      ),
    },
  ]
}

export function CaseTable({ status }: { status: Status }) {
  const { t } = useTranslation()
  const router = useRouter()
  const labels = useDataTableLabels()
  const [order, setOrder] = useState<Order>("desc")
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.admin.deathCases.listCases,
    { status, order },
    { initialNumItems: 50 },
  )
  const columns = useMemo(() => buildColumns(status !== "under_review", t), [status, t])

  return (
    <DataTable
      columns={columns}
      data={results}
      viewOptions
      labels={labels}
      loading={pageStatus === "LoadingFirstPage"}
      server={{ status: pageStatus, loadMore }}
      serverSort={{ columnId: "submitted", onChange: setOrder }}
      onRowClick={(c) => router.push(`/review/${c._id}`)}
    />
  )
}
