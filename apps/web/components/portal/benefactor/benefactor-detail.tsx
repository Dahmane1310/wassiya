"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { ChevronLeft, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { daysFromNow, initialsOf, relPast, tintFor } from "../format"
import { ReleaseReveal } from "../release-reveal"
import { ReportDeath } from "../report-death"
import { InitialsAvatar } from "../ui/initials-avatar"
import { Page } from "../ui/page"
import { SectionTitle } from "../ui/section-title"
import { displayStatus, STATUS } from "../ui/status"
import { StatusBadge } from "../ui/status-badge"
import { RejectedCard, ReleasedCard, ReportCard, UnderReviewCard } from "./action-cards"
import { Stat, StatusCard } from "./status-card"
import { StatusTimeline, type TimelineStep } from "./status-timeline"

export function BenefactorDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const benefactors = useQuery(api.recipients.listMyBenefactors)
  const [showReport, setShowReport] = useState(false)
  const [showRelease, setShowRelease] = useState(false)

  if (benefactors === undefined) {
    return (
      <Page narrow className="flex justify-center pt-20">
        <Spinner className="text-muted-foreground size-5" />
      </Page>
    )
  }
  const b = benefactors.find((x) => x.beneficiaryId === id)
  if (!b) {
    return (
      <Page narrow>
        <p className="text-foreground/70 text-[15px] font-semibold">
          {t("benefactor.notAvailable")}
        </p>
        <Link href="/home" className="text-primary text-sm font-bold">
          {t("benefactor.backHome")}
        </Link>
      </Page>
    )
  }
  const shown = displayStatus(b.status, b.deathCase)
  const s = STATUS[shown]
  const rejected = shown === "rejected"
  const underReview = b.deathCase?.status === "under_review"
  const graceDays =
    b.graceStartedAt != null && b.gracePeriodMs != null
      ? daysFromNow(b.graceStartedAt + b.gracePeriodMs)
      : null
  const roleLabel = b.relationship
    ? t("benefactor.their", { relationship: b.relationship })
    : b.role === "heir"
      ? t("benefactor.aLegalHeir")
      : t("benefactor.aNamedRecipient")
  const timeline: TimelineStep[] = [
    { done: true, label: t("benefactor.timeline.named", { role: roleLabel }), when: "" },
    { done: true, label: t("benefactor.timeline.keySetUp"), when: t("benefactor.timeline.ready") },
    {
      done: b.status !== "active",
      label: t("benefactor.timeline.graceStep"),
      when: b.status === "active" ? "—" : t("benefactor.timeline.recently"),
    },
    {
      done: b.status === "released",
      label: t("benefactor.timeline.deathVerification"),
      when:
        b.status === "released"
          ? t("benefactor.timeline.approved")
          : rejected
            ? t("benefactor.timeline.needsAnotherLook")
            : b.status === "pending" && b.deathCase?.status === "under_review"
              ? t("benefactor.timeline.underReview")
              : b.status === "pending"
                ? t("benefactor.timeline.waitingReport")
                : "—",
    },
    {
      done: b.status === "released",
      label: t("benefactor.timeline.releasedStep"),
      when: b.status === "released" ? relPast(b.releaseAuthorizedAt) : "—",
    },
  ]

  return (
    <Page narrow className="pt-6.5">
      <Link
        href="/home"
        className="press text-foreground/70 hover:text-primary mb-5 inline-flex items-center gap-1 text-sm font-semibold transition-colors"
      >
        <ChevronLeft className="size-4" strokeWidth={2.4} /> {t("common.home")}
      </Link>

      <div className="mb-5.5 flex items-center gap-4.5">
        <InitialsAvatar initials={initialsOf(b.ownerName)} tint={tintFor(b.ownerId)} size={64} />
        <div className="flex-1">
          <h1 className="serif text-[27px] font-semibold tracking-tight">{b.ownerName}</h1>
          <div className="text-muted-foreground mt-0.5 text-sm font-semibold">
            {roleLabel}
            {b.shareLabel ? ` · ${b.shareLabel}` : ""}
          </div>
        </div>
        <StatusBadge tone={s.tone} icon={s.icon}>
          {t(s.label)}
        </StatusBadge>
      </div>

      <StatusCard
        status={shown}
        stat={
          b.status === "active" ? (
            <Stat
              label={t("benefactor.nextCheckInLabel")}
              value={t("benefactor.daysShort", { count: daysFromNow(b.nextDeadlineAt) ?? 0 })}
            />
          ) : b.status === "grace" ? (
            <Stat
              label={t("benefactor.graceEndsLabel")}
              value={t("benefactor.daysShort", { count: graceDays ?? 0 })}
            />
          ) : undefined
        }
      />

      {b.status === "released" && <ReleasedCard onView={() => setShowRelease(true)} />}

      {rejected && (
        <RejectedCard
          submittedAt={b.deathCase?.submittedAt ?? null}
          reason={b.deathCase?.rejectedReason ?? null}
          onResubmit={() => setShowReport(true)}
        />
      )}

      {underReview && b.status !== "released" && (
        <UnderReviewCard submittedAt={b.deathCase?.submittedAt ?? null} />
      )}

      {!rejected && !underReview && b.status !== "released" && (
        <ReportCard
          firstName={b.ownerName.split(" ")[0] ?? b.ownerName}
          onReport={() => setShowReport(true)}
        />
      )}

      {b.status !== "released" && (
        <Card className="mb-4 py-0">
          <CardContent className="p-5.5">
            <SectionTitle>{t("benefactor.reserved")}</SectionTitle>
            <div className="bg-muted flex items-center gap-3.5 rounded-2xl p-4">
              <div className="bg-secondary text-muted-foreground flex size-11 items-center justify-center rounded-xl">
                <Lock className="size-5.5" />
              </div>
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">
                  {b.itemCount > 0
                    ? b.itemCount === 1
                      ? t("benefactor.itemsSealedOne", { count: b.itemCount })
                      : t("benefactor.itemsSealedMany", { count: b.itemCount })
                    : t("benefactor.sealedUntilRelease")}
                </div>
                <div className="text-muted-foreground mt-px text-[12.5px]">
                  {t("benefactor.sealedNote")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="py-0">
        <CardContent className="p-5.5">
          <SectionTitle>{t("benefactor.statusTitle")}</SectionTitle>
          <StatusTimeline steps={timeline} />
        </CardContent>
      </Card>

      {showReport && (
        <ReportDeath
          beneficiaryId={b.beneficiaryId}
          ownerName={b.ownerName}
          onClose={() => setShowReport(false)}
        />
      )}
      {showRelease && (
        <ReleaseReveal
          ownerId={b.ownerId}
          ownerName={b.ownerName}
          onClose={() => setShowRelease(false)}
        />
      )}
    </Page>
  )
}
