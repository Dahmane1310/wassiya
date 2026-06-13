"use client"

import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Wordmark } from "@/components/portal/logo"

/** Pre-auth invite landing: brand panel + sign-in/sign-up choice. The
 *  headline personalizes when the invite preview knows the owner's name. */
export function SignInPanel({
  token,
  ownerName,
}: {
  token: string
  ownerName: string | null
}) {
  const { t } = useTranslation()
  const returnTo = encodeURIComponent(`/invite/${token}`)
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="hidden flex-col justify-between p-14 text-white lg:flex"
        style={{
          background:
            "radial-gradient(700px 500px at 30% 0%, oklch(0.3 0.02 60), transparent 60%), linear-gradient(160deg, var(--sidebar), oklch(0.14 0.01 60))",
        }}
      >
        <Wordmark size={44} />
        <div>
          <h1 className="serif text-[38px] leading-[1.12] font-semibold tracking-tight">
            {ownerName ? t("invite.trustedNamed1", { ownerName }) : t("invite.trustedAnon1")}
            <br />
            {t("invite.trusted2")}
          </h1>
          <p className="mt-4 max-w-[380px] text-[15.5px] leading-relaxed font-medium text-white/60">
            {t("invite.panelBody")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-white/50">
          <ShieldCheck className="text-gold size-4.5" /> {t("invite.privateFooter")}
        </div>
      </div>
      <div className="flex items-center justify-center p-10">
        <div className="w-up w-[360px] max-w-full">
          <h2 className="serif text-[27px] font-semibold tracking-tight">
            {t("invite.acceptTitle")}
          </h2>
          <p className="text-foreground/70 mt-2 text-sm leading-normal">
            {t("invite.acceptBody")}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              size="xl"
              className="w-full"
              onClick={() => (window.location.href = `/sign-in?returnTo=${returnTo}`)}
            >
              {t("auth.signIn")}
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full"
              onClick={() => (window.location.href = `/sign-up?returnTo=${returnTo}`)}
            >
              {t("auth.createAccount")}
            </Button>
          </div>
          <div className="text-muted-foreground mt-4.5 text-center text-[11.5px] leading-normal">
            {t("invite.terms")}
          </div>
        </div>
      </div>
    </div>
  )
}
