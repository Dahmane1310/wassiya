"use client"

import { useState } from "react"
import { KeyRound, Lock, ShieldCheck, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { IconBadge } from "./ui/icon-badge"

// title/body are i18n KEYS (locales/*.json "privacy" section).
const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Lock, title: "privacy.point1Title", body: "privacy.point1Body" },
  { icon: ShieldCheck, title: "privacy.point2Title", body: "privacy.point2Body" },
  { icon: KeyRound, title: "privacy.point3Title", body: "privacy.point3Body" },
]

/** Subtle link that opens the "How your privacy works" details. This is the ONE
 *  place the security story is spelled out, so the main flow stays plain. */
export function PrivacyLink({ label }: { label?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="press text-primary text-[13px] font-bold"
        onClick={() => setOpen(true)}
      >
        {label ?? t("privacy.linkLabel")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="serif text-[22px] tracking-tight">
              {t("privacy.title")}
            </DialogTitle>
            <DialogDescription>{t("privacy.sub")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3.5">
            {POINTS.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <IconBadge icon={p.icon} size={40} />
                <div>
                  <div className="text-sm font-bold">{t(p.title)}</div>
                  <div className="text-muted-foreground mt-px text-[12.5px] leading-normal">
                    {t(p.body)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-[11.5px] leading-normal">
            {t("privacy.technical")}
          </p>
          <Button className="w-full" onClick={() => setOpen(false)}>
            {t("privacy.gotIt")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
