"use client"

import { type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"
import { LangProvider } from "@/components/panel/lang-provider"
import { Logo } from "@/components/panel/logo"
import "@/lib/i18n"

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={44} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}

/** Centered branded frame for the admin auth pages (outside the panel shell,
 *  so it mounts its own LangProvider + i18n). */
export function AuthLayout({
  titleKey,
  subtitleKey,
  children,
}: {
  titleKey: string
  subtitleKey?: string
  children: ReactNode
}) {
  return (
    <LangProvider>
      <Translated titleKey={titleKey} subtitleKey={subtitleKey}>
        {children}
      </Translated>
    </LangProvider>
  )
}

function Translated({
  titleKey,
  subtitleKey,
  children,
}: {
  titleKey: string
  subtitleKey?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Shell title={t(titleKey)} subtitle={subtitleKey ? t(subtitleKey) : undefined}>
      {children}
    </Shell>
  )
}
