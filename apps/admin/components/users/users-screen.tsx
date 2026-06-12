"use client"

import { useTranslation } from "react-i18next"
import { CreateUserDialog } from "./create-user-dialog"
import { UserSearch } from "./user-search"
import { UsersTable } from "./users-table"

export function UsersScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("users.subtitle")}
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <UsersTable toolbar={<UserSearch />} />
    </div>
  )
}
