"use client"

import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { CountStat } from "@/components/shared/count-stat"

type Counts = {
  assets: { value: number; capped: boolean }
  familyMembers: { value: number; capped: boolean }
  wasiyyahTotalPct: number
}

export function UserVaultCard({ counts }: { counts: Counts }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userVault.title")}</CardTitle>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Lock className="size-3" /> {t("userVault.zk")}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/40 rounded-xl border p-3">
            <div className="text-lg font-semibold tabular-nums">
              <CountStat count={counts.assets} />
            </div>
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
              {t("userVault.assets")}
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl border p-3">
            <div className="text-lg font-semibold tabular-nums">
              <CountStat count={counts.familyMembers} />
            </div>
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
              {t("userVault.family")}
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl border p-3">
            <div className="text-lg font-semibold tabular-nums">
              {counts.wasiyyahTotalPct.toFixed(1)}%
            </div>
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
              {t("userVault.wasiyyah")}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("userVault.note")}
        </p>
      </CardContent>
    </Card>
  )
}
