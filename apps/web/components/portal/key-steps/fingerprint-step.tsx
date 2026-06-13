"use client"

import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

/** The out-of-band verification step: read the code to the person who named
 *  you so they know it's really you. */
export function FingerprintStep({
  fingerprint,
  body,
  onDone,
}: {
  fingerprint: string
  body: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className="py-0">
      <CardContent className="p-8">
        <div className="mb-2 flex justify-center">
          <div className="bg-accent text-primary flex size-15 items-center justify-center rounded-2xl">
            <Check className="size-7.5" />
          </div>
        </div>
        <h1 className="serif mt-2 text-center text-2xl font-semibold tracking-tight">
          {t("invite.confirmTitle")}
        </h1>
        <p className="text-foreground/70 mt-2 text-center text-sm leading-relaxed">
          {body}
        </p>
        <div className="mono bg-muted my-4.5 rounded-2xl border p-4.5 text-center text-base font-bold tracking-wide break-all">
          {fingerprint}
        </div>
        <Button size="xl" className="w-full" onClick={onDone}>
          <Check /> {t("invite.doneMatches")}
        </Button>
      </CardContent>
    </Card>
  )
}
