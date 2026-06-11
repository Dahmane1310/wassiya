"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useMutation, useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { AccessDenied } from "./access-denied"
import { AdminContext } from "./admin-context"

/** Resolves the signed-in user's panel access. Fires the one-time activation
 *  (invite fill-in / superadmin bootstrap) automatically, then provides the
 *  admin session to the tree. Server-side checks remain the real gate. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const status = useQuery(api.admin.access.getMyAdminStatus)
  const activate = useMutation(api.admin.access.activateAdminAccess)
  const fired = useRef(false)

  useEffect(() => {
    if (status?.status === "needsActivation" && !fired.current) {
      fired.current = true
      void activate()
    }
  }, [status, activate])

  if (status === undefined) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  if (status.status === "needsActivation") {
    return (
      <div className="text-muted-foreground flex min-h-[60svh] items-center justify-center gap-2 text-sm">
        <Spinner className="size-4" /> {t("accessDenied.activating")}
      </div>
    )
  }
  if (status.status === "none") return <AccessDenied />

  return (
    <AdminContext.Provider
      value={{ role: status.role ?? "admin", email: status.email }}
    >
      {children}
    </AdminContext.Provider>
  )
}
