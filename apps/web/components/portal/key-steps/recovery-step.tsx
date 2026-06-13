"use client"

import { useState } from "react"
import { Copy, TriangleAlert } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { StatusBadge } from "../ui/status-badge"

/** The save-your-recovery-code gate. Shown exactly once per (re)enrollment —
 *  the code never reaches the server and can never be shown again. */
export function RecoveryStep({
  title,
  recoveryCode,
  onContinue,
}: {
  title: string
  recoveryCode: string
  onContinue: () => void
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)
  return (
    <Card className="py-0">
      <CardContent className="p-8">
        <StatusBadge tone="amber" icon={TriangleAlert}>
          {t("invite.saveNow")}
        </StatusBadge>
        <h1 className="serif mt-3.5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-foreground/70 mt-2 text-sm leading-relaxed">
          {t("invite.recoveryBody1")} <b>{t("invite.recoveryBodyOnly")}</b>{" "}
          {t("invite.recoveryBody2")}
        </p>
        <div className="mono my-4.5 rounded-2xl bg-[var(--sidebar)] p-4.5 text-center text-lg font-semibold tracking-wide break-all text-white">
          {recoveryCode}
        </div>
        {/* QR of the code, generated locally — photograph or print it as a
            backup. The code never leaves this device either way. */}
        <div className="mb-3.5 flex items-center gap-4 rounded-2xl border p-4">
          <div className="shrink-0 rounded-lg bg-white p-2">
            <QRCodeSVG value={recoveryCode} size={104} marginSize={0} />
          </div>
          <p className="text-muted-foreground text-[12.5px] leading-normal">
            {t("invite.qrHint")}
          </p>
        </div>
        <Button
          variant="outline"
          size="xl"
          className="mb-3.5 w-full"
          onClick={() => void navigator.clipboard?.writeText(recoveryCode)}
        >
          <Copy /> {t("invite.copyCode")}
        </Button>
        <div className="bg-red-soft mb-3.5 flex items-start gap-2 rounded-xl p-3.5">
          <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
          <span className="text-destructive text-[12.5px] leading-normal font-semibold">
            {t("invite.loseWarning")}
          </span>
        </div>
        <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-snug font-semibold">
          <Checkbox
            checked={saved}
            onCheckedChange={(v) => setSaved(v === true)}
            className="mt-0.5"
          />
          {t("invite.savedConfirm")}
        </label>
        <Button size="xl" className="w-full" disabled={!saved} onClick={onContinue}>
          {t("common.continue")}
        </Button>
      </CardContent>
    </Card>
  )
}
