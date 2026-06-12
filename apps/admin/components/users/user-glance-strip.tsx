"use client"

import { type ReactNode } from "react"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CountStat } from "@/components/shared/count-stat"
import { EntitlementBadge } from "@/components/shared/entitlement-badge"
import { StateBadge } from "@/components/shared/state-badge"

type Props = {
  switchState: string | null
  entitlement: { plan: string; status: string }
  counts: {
    assets: { value: number; capped: boolean }
    familyMembers: { value: number; capped: boolean }
    wasiyyahTotalPct: number
  }
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-[76px] flex-col justify-center gap-1.5 rounded-xl border px-4 py-3">
      <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 text-sm font-semibold">{children}</div>
    </div>
  )
}

/** The at-a-glance strip under the identity header: switch state, plan, estate
 *  size and Wasiyyah usage — everything support scans for, in one row. */
export function UserGlanceStrip({ switchState, entitlement, counts }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={t("users.glanceSwitch")}>
          <StateBadge state={switchState} />
        </Tile>
        <Tile label={t("users.glancePlan")}>
          <EntitlementBadge plan={entitlement.plan} status={entitlement.status} />
        </Tile>
        <Tile label={t("users.glanceEstate")}>
          <span className="text-lg tabular-nums">
            <CountStat count={counts.assets} />
          </span>
          <span className="text-muted-foreground text-xs font-normal">
            {t("userVault.assets")}
          </span>
          <span className="text-lg tabular-nums">
            <CountStat count={counts.familyMembers} />
          </span>
          <span className="text-muted-foreground text-xs font-normal">
            {t("userVault.family")}
          </span>
        </Tile>
        <Tile label={t("userVault.wasiyyah")}>
          <span className="text-lg tabular-nums">{counts.wasiyyahTotalPct.toFixed(1)}%</span>
          <span className="text-muted-foreground text-xs font-normal">/ 33.3%</span>
        </Tile>
      </div>
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <Lock className="size-3" /> {t("userVault.note")}
      </p>
    </div>
  )
}
