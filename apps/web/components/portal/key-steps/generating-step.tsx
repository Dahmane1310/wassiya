"use client"

import { KeyRound } from "lucide-react"
import { useTranslation } from "react-i18next"

/** Animated "creating your key" moment (heartbeat + expanding rings). */
export function GeneratingStep() {
  const { t } = useTranslation()
  return (
    <div className="py-7 text-center">
      <div className="relative mx-auto mb-4 size-24">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="border-primary absolute inset-4.5 rounded-full border-2"
            style={{ animation: `wPulse 1.8s ${i * 0.9}s ease-out infinite` }}
          />
        ))}
        <div
          className="bg-accent text-primary flex size-24 items-center justify-center rounded-full"
          style={{ animation: "wHeart 2s ease-in-out infinite" }}
        >
          <KeyRound className="size-10.5" />
        </div>
      </div>
      <div className="serif text-[21px] font-semibold">{t("invite.generatingTitle")}</div>
      <div className="text-foreground/70 mt-1.5 text-[13.5px]">
        {t("invite.generatingSub")}
      </div>
    </div>
  )
}
