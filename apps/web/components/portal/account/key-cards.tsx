"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { RotateKey } from "./rotate-key"

/** Verification-code + recovery-code cards. Copy preserved verbatim; adds the
 *  fingerprint copy button and the lost-recovery-code rotation entry. */
export function KeyCards({ fingerprint }: { fingerprint: string | null }) {
  const { t } = useTranslation()
  const [showRotate, setShowRotate] = useState(false)

  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2">
      <Card className="py-0">
        <CardContent className="p-5.5">
          <div className="mb-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Check className="text-primary size-5" />
              <span className="text-[14.5px] font-bold">
                {t("account.keyCards.verificationCode")}
              </span>
            </div>
            {fingerprint && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={t("account.keyCards.copyAria")}
                onClick={() => {
                  void navigator.clipboard?.writeText(fingerprint)
                  toast.success(t("common.copied"))
                }}
              >
                <Copy />
              </Button>
            )}
          </div>
          {fingerprint ? (
            <div className="flex flex-col items-center gap-3">
              {/* Non-secret: scannable form of the same code, for in-person
                  verification. */}
              <div className="rounded-xl border bg-white p-2.5">
                <QRCodeSVG value={fingerprint} size={116} marginSize={0} />
              </div>
              <div className="mono text-muted-foreground max-w-full text-center text-[11.5px] font-semibold tracking-wide break-all">
                {fingerprint}
              </div>
            </div>
          ) : (
            <div className="mono text-[13.5px] font-bold">—</div>
          )}
          <div className="text-muted-foreground mt-3 text-center text-[12.5px] leading-normal">
            {t("account.keyCards.verificationHint")}
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        {/* Column layout: the lost-code action pins to the bottom so the card
            fills the grid row's stretched height without dead space. */}
        <CardContent className="flex h-full flex-col p-5.5">
          <div className="mb-3 flex items-center gap-2.5">
            <RefreshCw className="text-gold-deep size-5" />
            <span className="text-[14.5px] font-bold">
              {t("account.keyCards.recoveryCode")}
            </span>
          </div>
          <div className="text-foreground/70 text-[13.5px] font-semibold">
            {t("account.keyCards.savedWhenSetup")}
          </div>
          <div className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">
            {t("account.keyCards.recoveryHint")}
          </div>
          <div className="mt-auto pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowRotate(true)}
            >
              <RefreshCw /> {t("account.keyCards.lostCode")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showRotate && <RotateKey onClose={() => setShowRotate(false)} />}
    </div>
  )
}
