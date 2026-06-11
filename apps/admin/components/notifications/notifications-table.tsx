"use client"

import { useMemo, useState } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { cn } from "@workspace/ui/lib/utils"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { type Order } from "@/components/shared/order"
import { TimeCell } from "@/components/shared/time-cell"

export type NotificationStatus = "pending" | "sent" | "failed"
export type NotificationKind =
  | "beneficiary_invite"
  | "executor_invite"
  | "heartbeat_warning"
  | "attestation_request"
  | "death_review_result"
  | "release_notice"

type NotificationRow = {
  _id: Id<"notifications">
  _creationTime: number
  ownerId: string | null
  recipientEmail: string
  channel: string
  kind: string
  status: string
  attempts: number
  sentAt: number | null
  error: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  sent: "bg-green-600/10 text-green-700 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
}

function buildBaseColumns(t: TFunction): ColumnDef<NotificationRow>[] {
  return [
    {
      id: "queued",
      meta: { label: t("notifications.colQueued") },
      accessorFn: (n) => n._creationTime,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("notifications.colQueued")} />,
      cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
    },
    {
      id: "recipient",
      meta: { label: t("notifications.colRecipient") },
      accessorFn: (n) => n.recipientEmail,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("notifications.colRecipient")} />,
      cell: ({ row }) => <span className="text-sm">{row.original.recipientEmail}</span>,
    },
    {
      id: "kind",
      meta: { label: t("notifications.colKind") },
      accessorFn: (n) => n.kind,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("notifications.colKind")} />,
      cell: ({ row }) => (
        <Badge variant="outline">
          {t(`notifications.kinds.${row.original.kind}`, {
            defaultValue: row.original.kind.replaceAll("_", " "),
          })}
        </Badge>
      ),
    },
    {
      id: "status",
      meta: { label: t("notifications.colStatus") },
      accessorFn: (n) => n.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("notifications.colStatus")} />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn("border-transparent capitalize", STATUS_STYLES[row.original.status])}
        >
          {t(`notifications.statuses.${row.original.status}`, {
            defaultValue: row.original.status,
          })}
        </Badge>
      ),
    },
    {
      id: "attempts",
      meta: { label: t("notifications.colAttempts") },
      accessorFn: (n) => n.attempts,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("notifications.colAttempts")} />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.attempts}</span>,
    },
    {
      id: "error",
      meta: { label: t("notifications.colError") },
      enableSorting: false,
      header: t("notifications.colError"),
      cell: ({ row }) => (
        <span className="text-destructive max-w-56 truncate text-xs">
          {row.original.error ?? ""}
        </span>
      ),
    },
  ]
}

type Props = {
  status?: NotificationStatus
  kind?: NotificationKind
  recipientEmail?: string
  toolbar?: React.ReactNode
}

export function NotificationsTable({ status, kind, recipientEmail, toolbar }: Props) {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const [order, setOrder] = useState<Order>("desc")
  const retry = useMutation(api.admin.notifications.adminRetryNotification)
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.admin.notifications.listNotifications,
    { status, kind, recipientEmail: recipientEmail?.trim() || undefined, order },
    { initialNumItems: 50 },
  )

  const columns = useMemo<ColumnDef<NotificationRow>[]>(
    () => [
      ...buildBaseColumns(t),
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: "",
        cell: ({ row }) =>
          row.original.status === "failed" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title={t("notifications.retryTitle")}
              onClick={async () => {
                try {
                  await retry({ id: row.original._id })
                  toast.success(t("notifications.requeued"))
                } catch {
                  toast.error(t("notifications.retryFailed"))
                }
              }}
            >
              <RotateCw className="size-3.5" />
            </Button>
          ),
      },
    ],
    [retry, t],
  )

  return (
    <DataTable
      columns={columns}
      data={results}
      labels={labels}
      viewOptions
      exportName="notifications"
      toolbar={toolbar}
      loading={pageStatus === "LoadingFirstPage"}
      server={{ status: pageStatus, loadMore }}
      serverSort={{ columnId: "queued", onChange: setOrder }}
    />
  )
}
