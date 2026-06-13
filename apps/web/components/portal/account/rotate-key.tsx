"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { enrollRecipient } from "@workspace/crypto"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { FingerprintStep } from "../key-steps/fingerprint-step"
import { GeneratingStep } from "../key-steps/generating-step"
import { RecoveryStep } from "../key-steps/recovery-step"

type Step = "warn" | "generating" | "recovery" | "fingerprint" | "done"

/** Maps rotation failures to an i18n KEY — rendered with t() below. */
function friendlyErrorKey(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (msg.includes("ROTATION_BLOCKED_RELEASED")) return "account.rotate.blockedReleased"
  if (msg.includes("ROTATION_BLOCKED_OWNER_UNREACHABLE")) {
    return "account.rotate.blockedOwnerUnreachable"
  }
  return "common.genericError"
}

/** "Lost your recovery code?" — generates a fresh key + recovery code and
 *  replaces the old one. The people who named you don't need to do anything:
 *  everything left for you is re-secured to the new key automatically the
 *  next time they open their app. */
export function RotateKey({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const rotate = useMutation(api.recipients.rotateKeypair)
  const [step, setStep] = useState<Step>("warn")
  const [understood, setUnderstood] = useState(false)
  const [errorKey, setErrorKey] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [fingerprint, setFingerprint] = useState("")

  async function start() {
    setStep("generating")
    setErrorKey("")
    try {
      const { enrollment, recoveryCode } = await enrollRecipient()
      await rotate(enrollment)
      setRecoveryCode(recoveryCode)
      setFingerprint(enrollment.keyFingerprint)
      setStep("recovery")
    } catch (e) {
      setErrorKey(friendlyErrorKey(e))
      setStep("warn")
    }
  }

  // The code/fingerprint steps render full cards of their own.
  if (step === "recovery" || step === "fingerprint" || step === "generating") {
    return (
      <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-black/50 p-6 backdrop-blur-sm">
        <div className="w-up w-[460px] max-w-full">
          {step === "generating" && <GeneratingStep />}
          {step === "recovery" && (
            <RecoveryStep
              title={t("account.rotate.newCodeTitle")}
              recoveryCode={recoveryCode}
              onContinue={() => setStep("fingerprint")}
            />
          )}
          {step === "fingerprint" && (
            <FingerprintStep
              fingerprint={fingerprint}
              body={t("account.rotate.fingerprintBody")}
              onDone={onClose}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("account.rotate.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("account.rotate.dialogDesc")}</DialogDescription>
        </DialogHeader>
        {errorKey && (
          <div className="bg-red-soft text-destructive flex items-start gap-2 rounded-xl p-3.5 text-[13px] leading-normal font-semibold">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t(errorKey)}
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-snug font-semibold">
          <Checkbox
            checked={understood}
            onCheckedChange={(v) => setUnderstood(v === true)}
            className="mt-0.5"
          />
          {t("account.rotate.understand")}
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!understood} onClick={() => void start()}>
            <RefreshCw /> {t("account.rotate.getNewCode")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
