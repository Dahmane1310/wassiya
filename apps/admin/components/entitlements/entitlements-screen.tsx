"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { DebouncedInput } from "@/components/shared/debounced-input"
import {
  EntitlementsTable,
  type EntitlementPlan,
  type EntitlementStatus,
} from "./entitlements-table"
import { GrantDialog } from "./grant-dialog"

const ALL = "all"

export function EntitlementsScreen() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string>(ALL)
  const [plan, setPlan] = useState<string>(ALL)
  const [ownerId, setOwnerId] = useState("")
  const dirty = status !== ALL || plan !== ALL || ownerId !== ""

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("entitlements.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("entitlements.subtitle")}
          </p>
        </div>
        <GrantDialog />
      </div>
      <EntitlementsTable
        status={status === ALL ? undefined : (status as EntitlementStatus)}
        plan={plan === ALL ? undefined : (plan as EntitlementPlan)}
        ownerId={ownerId}
        toolbar={
          <>
            <DebouncedInput
              value={ownerId}
              onChange={setOwnerId}
              placeholder={t("entitlements.ownerIdPlaceholder")}
              className="w-60"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("entitlements.allStatuses")}</SelectItem>
                <SelectItem value="trialing">{t("entStatus.trialing")}</SelectItem>
                <SelectItem value="active">{t("entStatus.active")}</SelectItem>
                <SelectItem value="past_due">{t("entStatus.past_due")}</SelectItem>
                <SelectItem value="canceled">{t("entStatus.canceled")}</SelectItem>
                <SelectItem value="expired">{t("entStatus.expired")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("entitlements.allPlans")}</SelectItem>
                <SelectItem value="trial">{t("plans.trial")}</SelectItem>
                <SelectItem value="annual">{t("plans.annual")}</SelectItem>
                <SelectItem value="lifetime">{t("plans.lifetime")}</SelectItem>
              </SelectContent>
            </Select>
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setStatus(ALL)
                  setPlan(ALL)
                  setOwnerId("")
                }}
              >
                <RotateCcw className="size-3.5" /> {t("common.reset")}
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}
