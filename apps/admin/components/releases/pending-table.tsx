"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePaginatedQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"

type PendingRow = {
  ownerId: string
  ownerEmail: string | null
  pendingSince: number | null
  longstopAt: number | null
  requireDeathVerification: boolean
  deathCaseStatus: string | null
}

const STATUS_KEYS: Record<string, string> = {
  under_review: "review.tabUnderReview",
  approved: "review.tabApproved",
  rejected: "review.tabRejected",
}

function buildColumns(t: TFunction): ColumnDef<PendingRow>[] {
  return [
    {
      id: "owner",
      meta: { label: t("releases.colOwner") },
      accessorFn: (r) => r.ownerEmail ?? r.ownerId,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colOwner")} />,
      cell: ({ row }) => (
        <OwnerRef ownerId={row.original.ownerId} email={row.original.ownerEmail} />
      ),
    },
    {
      id: "pendingSince",
      meta: { label: t("releases.colPendingSince") },
      accessorFn: (r) => r.pendingSince ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colPendingSince")} />,
      cell: ({ row }) => <TimeCell ts={row.original.pendingSince} />,
    },
    {
      id: "autoRelease",
      meta: { label: t("releases.colAutoRelease") },
      accessorFn: (r) => r.longstopAt ?? Number.MAX_SAFE_INTEGER,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colAutoRelease")} />,
      cell: ({ row }) =>
        row.original.longstopAt !== null ? (
          <span className="text-amber-700 dark:text-amber-400">
            <TimeCell ts={row.original.longstopAt} />
          </span>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t("releases.needsReview")}
          </Badge>
        ),
    },
    {
      id: "deathCase",
      meta: { label: t("releases.colDeathReport") },
      accessorFn: (r) => r.deathCaseStatus ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("releases.colDeathReport")} />,
      cell: ({ row }) =>
        row.original.deathCaseStatus !== null ? (
          <Link
            href="/review"
            className="text-primary inline-flex items-center gap-1 text-sm capitalize hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_KEYS[row.original.deathCaseStatus] !== undefined
              ? t(STATUS_KEYS[row.original.deathCaseStatus]!)
              : row.original.deathCaseStatus.replace("_", " ")}
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">{t("releases.noneSubmitted")}</span>
        ),
    },
  ]
}

export function PendingTable() {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.estates.listPendingRelease,
    {},
    { initialNumItems: 50 },
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      loading={status === "LoadingFirstPage"}
      server={{ status, loadMore }}
    />
  )
}
