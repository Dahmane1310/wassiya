"use client"

import { useTranslation } from "react-i18next"
import { useAdminSession } from "@/components/panel/admin-context"
import { AccessDenied } from "@/components/panel/access-denied"
import { AddAdminDialog } from "./add-admin-dialog"
import { AdminsTable } from "./admins-table"

export function AdminsScreen() {
  const { t } = useTranslation()
  const session = useAdminSession()
  // UX-only guard (the nav item is already hidden) — the Convex functions
  // reject non-superadmins regardless.
  if (session?.role !== "superadmin") return <AccessDenied />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("admins.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admins.subtitle")}
          </p>
        </div>
        <AddAdminDialog />
      </div>
      <AdminsTable />
    </div>
  )
}
