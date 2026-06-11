"use client"

import { useMutation } from "convex/react"
import { type TFunction } from "i18next"
import { Pause, Play } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StateBadge } from "@/components/shared/state-badge"
import { TimeCell } from "@/components/shared/time-cell"
import { DetailRow } from "./detail-row"

type Switch = {
  state: string
  checkInIntervalMs: number
  gracePeriodMs: number
  lastCheckInAt: number
  nextDeadlineAt: number
  graceStartedAt: number | null
  releaseAuthorizedAt: number | null
  checkInStreak: number
} | null

function days(ms: number, t: TFunction): string {
  const d = Math.round(ms / 86_400_000)
  return t("userSwitch.days", { count: d })
}

export function UserSwitchCard({ ownerId, sw }: { ownerId: string; sw: Switch }) {
  const { t } = useTranslation()
  const pause = useMutation(api.admin.switchControl.adminPauseSwitch)
  const resume = useMutation(api.admin.switchControl.adminResumeSwitch)

  const canPause = sw !== null && !["released", "paused"].includes(sw.state)
  const canResume = sw?.state === "paused"

  return (
    <Card className="gap-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{t("userSwitch.title")}</CardTitle>
        {sw !== null && <StateBadge state={sw.state} />}
      </CardHeader>
      <CardContent>
        {sw === null ? (
          <p className="text-muted-foreground text-sm">{t("userSwitch.notArmed")}</p>
        ) : (
          <div className="divide-border/50 divide-y">
            <DetailRow label={t("userSwitch.cadence")}>
              {t("userSwitch.cadenceValue", { interval: days(sw.checkInIntervalMs, t) })}
              <span className="text-muted-foreground font-normal">
                {" "}
                · {t("userSwitch.graceSuffix", { grace: days(sw.gracePeriodMs, t) })}
              </span>
            </DetailRow>
            <DetailRow label={t("userSwitch.lastCheckIn")}>
              <TimeCell ts={sw.lastCheckInAt} />
              {sw.checkInStreak > 0 && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {t("userSwitch.onTimeSuffix", { count: sw.checkInStreak })}
                </span>
              )}
            </DetailRow>
            {sw.state !== "released" && (
              <DetailRow label={sw.state === "grace" ? t("userSwitch.graceEnds") : t("userSwitch.nextDeadline")}>
                <TimeCell ts={sw.nextDeadlineAt} />
              </DetailRow>
            )}
            {sw.releaseAuthorizedAt !== null && (
              <DetailRow label={t("userSwitch.released")}><TimeCell ts={sw.releaseAuthorizedAt} /></DetailRow>
            )}
          </div>
        )}
      </CardContent>
      {(canPause || canResume) && (
        <CardFooter className="justify-end gap-2 border-t pt-4!">
          {canPause && (
            <ConfirmDialog
              trigger={<Button variant="outline" size="sm"><Pause /> {t("userSwitch.pause")}</Button>}
              title={t("userSwitch.pauseTitle")}
              description={t("userSwitch.pauseBody")}
              confirmLabel={t("userSwitch.pause")}
              onConfirm={async () => {
                try {
                  await pause({ ownerId })
                  toast.success(t("userSwitch.paused"))
                } catch {
                  toast.error(t("userSwitch.pauseFailed"))
                }
              }}
            />
          )}
          {canResume && (
            <ConfirmDialog
              trigger={<Button variant="outline" size="sm"><Play /> {t("userSwitch.resume")}</Button>}
              title={t("userSwitch.resumeTitle")}
              description={t("userSwitch.resumeBody")}
              confirmLabel={t("userSwitch.resume")}
              onConfirm={async () => {
                try {
                  await resume({ ownerId })
                  toast.success(t("userSwitch.resumed"))
                } catch {
                  toast.error(t("userSwitch.resumeFailed"))
                }
              }}
            />
          )}
        </CardFooter>
      )}
    </Card>
  )
}
