"use client"

import { useQuery } from "convex/react"
import { Lock, LockOpen, TriangleAlert, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { PrivacyLink } from "../privacy-explainer"
import { Page } from "../ui/page"
import { SectionTitle } from "../ui/section-title"
import { BenefactorCard } from "./benefactor-card"
import { KeyStatusCard } from "./key-status-card"

export function Home() {
  const { t } = useTranslation()
  const benefactors = useQuery(api.recipients.listMyBenefactors)
  const keyStatus = useQuery(api.recipients.getMyRecipientStatus)

  if (benefactors === undefined) {
    return (
      <Page className="flex justify-center pt-20">
        <Spinner className="text-muted-foreground size-5" />
      </Page>
    )
  }
  // Support-disabled account: every query returns empty, so show the real reason.
  if (keyStatus?.disabled) {
    return (
      <Page>
        <Card>
          <CardContent className="text-muted-foreground p-7 text-center">
            <TriangleAlert className="text-destructive mx-auto mb-2.5 size-7" />
            <div className="text-foreground/80 text-[15.5px] font-bold">
              {t("home.disabledTitle")}
            </div>
            <div className="mt-1 text-[13px] leading-relaxed">
              {t("home.disabledBody")}
            </div>
          </CardContent>
        </Card>
      </Page>
    )
  }
  const released = benefactors.filter((b) => b.status === "released").length

  return (
    <Page>
      <div className="mb-6.5">
        <div className="ar text-muted-foreground text-sm font-semibold">
          {t("home.greeting")}
        </div>
        <h1 className="serif mt-1 text-[32px] font-semibold tracking-tight">
          {t("home.welcome")}
        </h1>
        <p className="text-foreground/70 mt-2 max-w-[540px] text-[15px] leading-relaxed font-medium">
          {t("home.intro")}
        </p>
      </div>

      <KeyStatusCard
        enrolled={keyStatus?.enrolled ?? false}
        fingerprint={keyStatus?.keyFingerprint ?? null}
      />

      {released > 0 && (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-[color-mix(in_oklch,var(--blue)_20%,var(--card))] bg-[var(--blue-soft)] px-4.5 py-3.5">
          <LockOpen className="size-5 shrink-0 text-[var(--blue)]" />
          <div className="flex-1 text-[13.5px] font-semibold text-[var(--blue-600)]">
            {released === 1
              ? t("home.releasedBannerOne", { count: released })
              : t("home.releasedBannerMany", { count: released })}
          </div>
        </div>
      )}

      <div className="mt-8.5">
        <SectionTitle
          sub={
            benefactors.length
              ? benefactors.length === 1
                ? t("home.entrustedOne", { count: benefactors.length })
                : t("home.entrustedMany", { count: benefactors.length })
              : undefined
          }
        >
          {t("home.peopleWhoNamedYou")}
        </SectionTitle>
        {benefactors.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-7 text-center">
              <User className="mx-auto mb-2.5 size-7" />
              <div className="text-foreground/80 text-[14.5px] font-bold">
                {t("home.emptyTitle")}
              </div>
              <div className="mt-0.5 text-[13px]">{t("home.emptyBody")}</div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3.5">
            {benefactors.map((b) => (
              <BenefactorCard key={b.beneficiaryId} b={b} />
            ))}
          </div>
        )}
      </div>

      <div className="text-muted-foreground mt-7.5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5" />
          <span className="text-center text-[12.5px] leading-relaxed font-medium">
            {t("home.privateFooter")}
          </span>
        </div>
        <PrivacyLink />
      </div>
    </Page>
  )
}
