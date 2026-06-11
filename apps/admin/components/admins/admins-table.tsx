"use client"

import { useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { TimeCell } from "@/components/shared/time-cell"

type AdminRow = {
  _id: Id<"admins">
  _creationTime: number
  tokenIdentifier: string | null
  email: string | null
  role: "superadmin" | "admin"
  addedBy: string | null
  note: string | null
  activated: boolean
}

export function AdminsTable() {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const admins = useQuery(api.admin.admins.listAdmins)
  const remove = useMutation(api.admin.admins.removeAdmin)

  const columns = useMemo<ColumnDef<AdminRow>[]>(
    () => [
      {
        id: "email",
        meta: { label: t("admins.colEmail") },
        accessorFn: (a) => a.email ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("admins.colEmail")} />,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email ?? "—"}</span>
        ),
      },
      {
        id: "role",
        meta: { label: t("admins.colRole") },
        accessorFn: (a) => a.role,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("admins.colRole")} />,
        cell: ({ row }) =>
          row.original.role === "superadmin" ? (
            <Badge>{t("roles.superadmin")}</Badge>
          ) : (
            <Badge variant="secondary">{t("roles.admin")}</Badge>
          ),
      },
      {
        id: "status",
        meta: { label: t("admins.colStatus") },
        accessorFn: (a) => a.activated,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("admins.colStatus")} />,
        cell: ({ row }) =>
          row.original.activated ? (
            <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">{t("admins.active")}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">{t("admins.invitedBadge")}</Badge>
          ),
      },
      {
        id: "added",
        meta: { label: t("admins.colAdded") },
        accessorFn: (a) => a._creationTime,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("admins.colAdded")} />,
        cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
      },
      {
        id: "note",
        meta: { label: t("admins.colNote") },
        enableSorting: false,
        header: t("admins.colNote"),
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-44 truncate text-sm">
            {row.original.note ?? ""}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: "",
        cell: ({ row }) =>
          row.original.role !== "superadmin" && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="text-destructive size-7">
                  <Trash2 className="size-4" />
                </Button>
              }
              title={t("admins.removeTitle", {
                email: row.original.email ?? t("admins.thisAdmin"),
              })}
              description={t("admins.removeBody")}
              confirmLabel={t("admins.remove")}
              destructive
              onConfirm={async () => {
                try {
                  await remove({ id: row.original._id })
                  toast.success(t("admins.removed"))
                } catch {
                  toast.error(t("admins.removeFailed"))
                }
              }}
            />
          ),
      },
    ],
    [remove, t],
  )

  return (
    <DataTable
      columns={columns}
      data={admins ?? []}
      labels={labels}
      loading={admins === undefined}
      clientSearch={t("admins.filterPlaceholder")}
    />
  )
}
