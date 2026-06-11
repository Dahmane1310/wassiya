"use client"

import { useEffect, type ReactNode } from "react"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AdminGate } from "./admin-gate"
import { AdminSidebar } from "./admin-sidebar"
import { LangProvider } from "./lang-provider"
import { PanelHeader } from "./panel-header"

function RedirectToSignIn() {
  useEffect(() => {
    window.location.href = "/sign-in"
  }, [])
  return null
}

/** The admin panel frame: auth guards → admin gate → sidebar + header + content. */
export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center">
          <Skeleton className="h-8 w-44" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
      <Authenticated>
        <AdminGate>
          {/* This repo's Tooltip needs an explicit provider ancestor — the
              sidebar's collapsed-state tooltips and TimeCell both rely on it. */}
          <LangProvider>
            <TooltipProvider delayDuration={300}>
              <SidebarProvider>
                <AdminSidebar />
                {/* Cap the inset at the viewport and scroll ONLY the main area,
                    so the header stays put on every page. */}
                <SidebarInset className="h-svh overflow-hidden">
                  <PanelHeader />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </LangProvider>
        </AdminGate>
      </Authenticated>
    </>
  )
}
