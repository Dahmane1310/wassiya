"use client"

import { useTranslation } from "react-i18next"
import { BeneficiaryLookup } from "./beneficiary-lookup"

export function BeneficiariesScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("beneficiaries.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("beneficiaries.subtitle")}</p>
      </div>
      <BeneficiaryLookup />
    </div>
  )
}
