"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { Check, House, KeyRound, Lock, RefreshCw, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { enrollRecipient, sha256 } from "@workspace/crypto"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { FingerprintStep } from "@/components/portal/key-steps/fingerprint-step"
import { GeneratingStep } from "@/components/portal/key-steps/generating-step"
import { RecoveryStep } from "@/components/portal/key-steps/recovery-step"
import { Logo } from "@/components/portal/logo"
import { PrivacyLink } from "@/components/portal/privacy-explainer"
import { IconBadge } from "@/components/portal/ui/icon-badge"
import { Centered } from "./centered"

type Step = "intro" | "generating" | "recovery" | "fingerprint" | "done" | "error"

// t/s are i18n KEYS (locales/*.json "invite" section).
const INTRO_POINTS = [
  { icon: Lock, t: "invite.point1Title", s: "invite.point1Body" },
  { icon: RefreshCw, t: "invite.point2Title", s: "invite.point2Body" },
  { icon: Check, t: "invite.point3Title", s: "invite.point3Body" },
]

/** Maps redemption failures to an i18n KEY — rendered with t() below. */
function friendlyErrorKey(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (msg.includes("Invalid invite")) return "invite.invalidTitle"
  if (msg.includes("already been used")) return "invite.errUsed"
  if (msg.includes("expired")) return "invite.errExpired"
  return "common.genericError"
}

/** Authenticated invite redemption + first-time key creation. The crypto and
 *  redemption logic is unchanged (moved verbatim); only the shell is new. */
export function EnrollFlow({ token }: { token: string }) {
  const { t } = useTranslation()
  const status = useQuery(api.recipients.getMyRecipientStatus)
  const redeem = useMutation(api.invites.redeemInvite)
  const enroll = useMutation(api.recipients.enrollKeypair)
  const [step, setStep] = useState<Step>("intro")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [fingerprint, setFingerprint] = useState("")
  const [errorKey, setErrorKey] = useState("")

  async function start() {
    setStep("generating")
    setErrorKey("")
    try {
      await redeem({ tokenHash: await sha256(token) })
      if (status?.enrolled) {
        setFingerprint(status.keyFingerprint ?? "")
        setStep("done")
        return
      }
      const { enrollment, recoveryCode } = await enrollRecipient()
      try {
        await enroll(enrollment)
      } catch (e) {
        if (e instanceof Error && e.message.includes("ALREADY_ENROLLED")) {
          setStep("done")
          return
        }
        throw e
      }
      setRecoveryCode(recoveryCode)
      setFingerprint(enrollment.keyFingerprint)
      setStep("recovery")
    } catch (e) {
      setErrorKey(friendlyErrorKey(e))
      setStep("error")
    }
  }

  if (status === undefined) {
    return (
      <Centered>
        <div className="flex justify-center">
          <Spinner className="text-muted-foreground size-5" />
        </div>
      </Centered>
    )
  }

  if (step === "intro" || step === "error") {
    return (
      <Centered>
        <Card className="py-0">
          <CardContent className="p-8">
            <div className="mb-4.5 flex justify-center">
              <Logo size={56} />
            </div>
            <h1 className="serif text-center text-[26px] font-semibold tracking-tight">
              {t("invite.setupTitle")}
            </h1>
            <p className="text-foreground/70 mt-2.5 text-center text-[14.5px] leading-relaxed">
              {t("invite.setupBody")}
            </p>
            <div className="my-5.5 flex flex-col gap-3">
              {INTRO_POINTS.map((x) => (
                <div key={x.t} className="flex items-start gap-3">
                  <IconBadge icon={x.icon} size={40} />
                  <div>
                    <div className="text-sm font-bold">{t(x.t)}</div>
                    <div className="text-muted-foreground mt-px text-[12.5px]">{t(x.s)}</div>
                  </div>
                </div>
              ))}
            </div>
            {errorKey && (
              <div className="text-destructive mb-3 text-center text-[13px] font-semibold">
                {t(errorKey)}
              </div>
            )}
            <Button size="xl" className="w-full" onClick={() => void start()}>
              <KeyRound /> {t("invite.setupButton")}
            </Button>
            <div className="mt-3.5 text-center">
              <PrivacyLink />
            </div>
          </CardContent>
        </Card>
      </Centered>
    )
  }

  if (step === "generating") {
    return (
      <Centered>
        <GeneratingStep />
      </Centered>
    )
  }

  if (step === "recovery") {
    return (
      <Centered>
        <RecoveryStep
          title={t("invite.recoveryTitle")}
          recoveryCode={recoveryCode}
          onContinue={() => setStep("fingerprint")}
        />
      </Centered>
    )
  }

  if (step === "fingerprint") {
    return (
      <Centered>
        <FingerprintStep
          fingerprint={fingerprint}
          body={t("invite.fingerprintBody")}
          onDone={() => setStep("done")}
        />
      </Centered>
    )
  }

  return (
    <Centered>
      <div className="py-5 text-center">
        <div
          className="bg-green-soft text-green mx-auto mb-4.5 flex size-24 items-center justify-center rounded-full"
          style={{ animation: "wPop .6s ease" }}
        >
          <ShieldCheck className="size-12" strokeWidth={1.7} />
        </div>
        <h1 className="serif text-[26px] font-semibold tracking-tight">
          {t("invite.allSet")}
        </h1>
        <p className="text-foreground/70 mx-auto mt-2.5 max-w-[380px] text-[14.5px] leading-relaxed">
          {t("invite.allSetBody")}
        </p>
        <div className="mt-6.5">
          <Button size="xl" onClick={() => (window.location.href = "/home")}>
            <House /> {t("invite.goHome")}
          </Button>
        </div>
      </div>
    </Centered>
  )
}
