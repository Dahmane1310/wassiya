"use client"

import { createContext, useContext } from "react"

// Provided by AdminGate once the signed-in user is an ACTIVE admin. Drives
// UX-only decisions (hiding the Admins nav item); authorization itself is
// enforced server-side in every Convex admin function.
export type AdminSession = {
  role: "superadmin" | "admin"
  email: string | null
}

export const AdminContext = createContext<AdminSession | null>(null)

export function useAdminSession(): AdminSession | null {
  return useContext(AdminContext)
}
