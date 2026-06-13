"use client"

import Link from "next/link"
import { ChevronRight, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"
import { StatusBadge } from "../ui/status-badge"

/** The "your key" summary card on home — links to the account page. */
export function KeyStatusCard({
  enrolled,
  fingerprint,
}: {
  enrolled: boolean
  fingerprint: string | null
}) {
  const { t } = useTranslation()
  return (
    <Link href="/account" className="block">
      <Card className="lift cursor-pointer py-0">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={
              "flex size-13 shrink-0 items-center justify-center rounded-2xl " +
              (enrolled
                ? "bg-green-soft text-green"
                : "bg-amber-soft text-amber-700 dark:text-amber-400")
            }
          >
            <ShieldCheck className="size-6.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[15.5px] font-bold">
                {enrolled ? t("home.key.ready") : t("home.key.setup")}
              </span>
              {enrolled ? (
                <StatusBadge tone="green" dot>
                  {t("home.key.readyBadge")}
                </StatusBadge>
              ) : (
                <StatusBadge tone="amber" dot>
                  {t("home.key.actionNeeded")}
                </StatusBadge>
              )}
            </div>
            <div className="text-muted-foreground mt-0.5 text-[13px]">
              {enrolled && fingerprint ? (
                <>
                  {t("home.key.savedPrefix")}{" "}
                  <span className="mono text-foreground/70">
                    {fingerprint.slice(0, 23)}…
                  </span>
                </>
              ) : (
                t("home.key.openInvite")
              )}
            </div>
          </div>
          <div className="text-foreground/70 flex shrink-0 items-center gap-1.5 text-[13.5px] font-bold">
            {t("common.manage")}
            <ChevronRight className="size-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
