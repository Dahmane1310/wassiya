"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { OwnerRef } from "@/components/shared/owner-ref"
import { StateBadge } from "@/components/shared/state-badge"
import { TimeCell } from "@/components/shared/time-cell"
import { CaseFacts } from "./case-facts"
import { CertViewer } from "./cert-viewer"
import { DecisionForm } from "./decision-form"
import { ReopenButton } from "./reopen-button"

/** Dedicated review page: large certificate viewer with the facts and decision
 *  in a sidebar — everything a reviewer needs on one screen. */
export function CaseScreen({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useQuery(api.admin.deathCases.getCase, {
    id: caseId as Id<"deathVerification">,
  })

  if (c === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-[88px] w-full rounded-2xl" />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[560px] w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }
  if (c === null) {
    return (
      <Empty className="rounded-2xl border">
        <EmptyTitle>{t("review.caseNotFound")}</EmptyTitle>
        <EmptyDescription>{t("review.caseNotFoundBody")}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ms-2">
          <Link href="/review">
            <ChevronLeft className="size-4 rtl:rotate-180" /> {t("review.backToQueue")}
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {c.ownerEmail ?? c.ownerId.split("|").pop()}
            </h1>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
              <span>
                {t("review.dialogSubmitted", {
                  email: c.submittedByEmail ?? t("review.unknownSubmitter"),
                })}
              </span>
              <TimeCell ts={c.submittedAt} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StateBadge state={c.switchState} />
            <OwnerRef ownerId={c.ownerId} email={null} />
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="order-2 py-5 lg:order-1">
          <CardContent className="px-5">
            <CertViewer caseId={c._id} hasCertificate={c.hasCertificate} />
          </CardContent>
        </Card>
        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Card className="py-5">
            <CardContent className="px-5">
              <CaseFacts deathCase={c} />
            </CardContent>
          </Card>
          {c.status === "under_review" ? (
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3 px-5">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t("review.decision")}
                </div>
                <DecisionForm
                  caseId={c._id}
                  ownerEmail={c.ownerEmail}
                  onDone={() => router.push("/review")}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="py-5">
              <CardContent className="px-5">
                <ReopenButton
                  caseId={c._id}
                  released={c.switchState === "released"}
                  onDone={() => router.push("/review")}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
