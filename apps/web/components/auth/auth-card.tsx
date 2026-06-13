"use client"

import { type ReactNode } from "react"
import { Card, CardContent } from "@workspace/ui/components/card"

/** Shared card shell for the auth forms: serif title + quiet sub line. */
export function AuthCard({
  title,
  sub,
  children,
}: {
  title: ReactNode
  sub?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-8">
        <h1 className="serif text-[26px] font-semibold tracking-tight">{title}</h1>
        {sub && (
          <p className="text-foreground/70 mt-2 text-sm leading-normal">{sub}</p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
