"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { CaseTable } from "./case-table"

type Status = "under_review" | "approved" | "rejected"

export function ReviewScreen() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>("under_review")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("review.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("review.subtitle")}</p>
      </div>
      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList>
          <TabsTrigger value="under_review">{t("review.tabUnderReview")}</TabsTrigger>
          <TabsTrigger value="approved">{t("review.tabApproved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("review.tabRejected")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <CaseTable status={status} />
    </div>
  )
}
