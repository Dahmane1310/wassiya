"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Check, KeyRound, Lock, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { enrollRecipient } from "@workspace/crypto"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { FingerprintStep } from "../key-steps/fingerprint-step"
import { GeneratingStep } from "../key-steps/generating-step"
import { RecoveryStep } from "../key-steps/recovery-step"
import { PrivacyLink } from "../privacy-explainer"
import { IconBadge } from "../ui/icon-badge"

type Step = "intro" | "generating" | "recovery" | "fingerprint"

// Same vetted copy as the invite enrollment (locales "invite" section).
const INTRO_POINTS = [
  { icon: Lock, t: "invite.point1Title", s: "invite.point1Body" },
  { icon: RefreshCw, t: "invite.point2Title", s: "invite.point2Body" },
  { icon: Check, t: "invite.point3Title", s: "invite.point3Body" },
]

/** Standalone key setup from the My Key page — same wizard as the invite
 *  enrollment, minus the invite redemption. A later invite from any owner
 *  links instantly once a keypair exists. */
export function SetupKey({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const enroll = useMutation(api.recipients.enrollKeypair)
  const [step, setStep] = useState<Step>("intro")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [fingerprint, setFingerprint] = useState("")
  const [errorKey, setErrorKey] = useState("")

  async function start() {
    setStep("generating")
    setErrorKey("")
    try {
      const { enrollment, recoveryCode } = await enrollRecipient()
      try {
        await enroll(enrollment)
      } catch (e) {
        if (e instanceof Error && e.message.includes("ALREADY_ENROLLED")) {
          onClose()
          return
        }
        throw e
      }
      setRecoveryCode(recoveryCode)
      setFingerprint(enrollment.keyFingerprint)
      setStep("recovery")
    } catch {
      setErrorKey("common.genericError")
      setStep("intro")
    }
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-black/50 p-6 backdrop-blur-sm">
      <div className="w-up w-[460px] max-w-full">
        {step === "intro" && (
          <Card className="py-0">
            <CardContent className="p-8">
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
                      <div className="text-muted-foreground mt-px text-[12.5px]">
                        {t(x.s)}
                      </div>
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
              <div className="mt-3.5 flex items-center justify-center gap-4">
                <PrivacyLink />
                <button
                  type="button"
                  className="press text-muted-foreground text-[13px] font-semibold"
                  onClick={onClose}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === "generating" && <GeneratingStep />}
        {step === "recovery" && (
          <RecoveryStep
            title={t("invite.recoveryTitle")}
            recoveryCode={recoveryCode}
            onContinue={() => setStep("fingerprint")}
          />
        )}
        {step === "fingerprint" && (
          <FingerprintStep
            fingerprint={fingerprint}
            body={t("invite.fingerprintBody")}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  )
}
