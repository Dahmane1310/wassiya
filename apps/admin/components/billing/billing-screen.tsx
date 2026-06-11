"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { DebouncedInput } from "@/components/shared/debounced-input"
import { BillingTable } from "./billing-table"

function BillingScreenInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [ownerId, setOwnerId] = useState(searchParams.get("ownerId") ?? "")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("billing.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("billing.subtitle")}
        </p>
      </div>
      <BillingTable
        ownerId={ownerId}
        toolbar={
          <DebouncedInput
            value={ownerId}
            onChange={setOwnerId}
            placeholder={t("entitlements.ownerIdPlaceholder")}
            className="w-60"
          />
        }
      />
    </div>
  )
}

export function BillingScreen() {
  return (
    <Suspense>
      <BillingScreenInner />
    </Suspense>
  )
}
