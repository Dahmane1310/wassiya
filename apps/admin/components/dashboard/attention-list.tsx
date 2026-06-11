"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

type Item = { label: string; href: string }

/** "Needs your attention" shortcuts — empty state means all clear. */
export function AttentionList({ items }: { items: Item[] }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-sm">{t("common.needsAttention")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {items.length === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-green-600" /> {t("common.allClear")}
          </div>
        ) : (
          items.map((i) => (
            <Link
              key={i.href + i.label}
              href={i.href}
              className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
            >
              {i.label}
              <ArrowRight className="text-muted-foreground size-4" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
