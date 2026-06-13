"use client"

import Link from "next/link"
import { type FunctionReturnType } from "convex/server"
import { ChevronRight, Info, LockOpen, TriangleAlert, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { daysFromNow, initialsOf, relPast, tintFor } from "../format"
import { InitialsAvatar } from "../ui/initials-avatar"
import { displayStatus, STATUS, TONE_STRIP, type Tone } from "../ui/status"
import { StatusBadge } from "../ui/status-badge"

type Benefactor = FunctionReturnType<typeof api.recipients.listMyBenefactors>[number]

/** One person who named the user, with their status and the action footer. */
export function BenefactorCard({ b }: { b: Benefactor }) {
  const { t } = useTranslation()
  const shown = displayStatus(b.status, b.deathCase)
  const s = STATUS[shown]
  const graceDays =
    b.graceStartedAt != null && b.gracePeriodMs != null
      ? daysFromNow(b.graceStartedAt + b.gracePeriodMs)
      : null
  const meta =
    shown === "rejected"
      ? t("benefactor.meta.reviewed")
      : b.status === "active"
        ? t("benefactor.meta.nextCheckIn", { count: daysFromNow(b.nextDeadlineAt) ?? 0 })
        : b.status === "grace"
          ? t("benefactor.meta.graceEnds", { count: graceDays ?? 0 })
          : b.status === "released"
            ? t("benefactor.meta.released", { when: relPast(b.releaseAuthorizedAt) })
            : t("benefactor.meta.underReview")
  const footer: { tone: Tone; icon: LucideIcon; text: string } | null =
    b.status === "released"
      ? {
          tone: "blue",
          icon: LockOpen,
          text: t("benefactor.footer.released"),
        }
      : shown === "rejected"
        ? {
            tone: "red",
            icon: TriangleAlert,
            text: t("benefactor.footer.rejected"),
          }
        : b.status === "grace"
          ? {
              tone: "amber",
              icon: Info,
              text: t("benefactor.footer.grace"),
            }
          : null

  return (
    <Link href={`/benefactor/${b.beneficiaryId}`} className="block">
      <Card className="lift cursor-pointer gap-0 overflow-hidden py-0">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5.5 py-4.5">
          <InitialsAvatar initials={initialsOf(b.ownerName)} tint={tintFor(b.ownerId)} size={50} />
          <div className="min-w-0">
            <div className="truncate text-[16.5px] font-bold tracking-tight">
              {b.ownerName}
            </div>
            <div className="text-muted-foreground mt-0.5 text-[13.5px] font-semibold">
              {b.relationship
                ? t("benefactor.their", { relationship: b.relationship })
                : b.role === "heir"
                  ? t("benefactor.legalHeir")
                  : t("benefactor.namedRecipient")}
              {b.shareLabel ? ` · ${b.shareLabel}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="text-end">
              <StatusBadge tone={s.tone} icon={s.icon}>
                {t(s.label)}
              </StatusBadge>
              <div className="text-muted-foreground mt-1.5 text-xs font-semibold">{meta}</div>
            </div>
            <ChevronRight className="text-muted-foreground size-4.5" />
          </div>
        </div>
        {footer && (
          <div
            className={cn(
              "flex items-center gap-2.5 border-t px-5.5 py-3 text-[13px] font-bold",
              TONE_STRIP[footer.tone],
            )}
          >
            <footer.icon className="size-4 shrink-0" />
            <span>{footer.text}</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
