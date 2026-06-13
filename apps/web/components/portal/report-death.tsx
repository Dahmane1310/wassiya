"use client"

import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { ArrowRight, Check, File, Lock, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

/**
 * Report a death → submit a certificate for admin review. Any enrolled beneficiary
 * of the owner may report; nothing releases on their word alone (an admin approves).
 * Upload/submit logic unchanged — only the shell moved to Dialog. Closing is
 * blocked while the upload is in flight. Error state holds an i18n KEY.
 */
export function ReportDeath({
  beneficiaryId,
  ownerName,
  onClose,
}: {
  beneficiaryId: string
  ownerName: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [role, setRole] = useState("")
  const [dateOfDeath, setDateOfDeath] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const generateUrl = useMutation(api.release.generateCertUploadUrl)
  const submit = useMutation(api.release.submitDeathReport)
  const first = ownerName.split(" ")[0]

  const MAX_FILE_BYTES = 10 * 1024 * 1024

  function pickFile(f: File | null) {
    setErrorKey("")
    if (f && f.size > MAX_FILE_BYTES) {
      setFile(null)
      setErrorKey("report.fileTooLarge")
      return
    }
    setFile(f)
  }

  async function doSubmit() {
    setBusy(true)
    setErrorKey("")
    try {
      let certificateStorageId: Id<"_storage"> | undefined
      if (file) {
        const url = await generateUrl()
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file })
        if (!res.ok) throw new Error("upload failed")
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
        certificateStorageId = storageId
      }
      const dod = dateOfDeath ? new Date(`${dateOfDeath}T00:00:00`).getTime() : undefined
      await submit({
        beneficiaryId: beneficiaryId as Id<"beneficiaries">,
        certificateStorageId,
        role: role.trim() || undefined,
        dateOfDeath: dod !== undefined && !Number.isNaN(dod) ? dod : undefined,
      })
      setStep(2)
    } catch {
      setErrorKey("report.submitFailed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
        {step === 0 && (
          <div>
            <div className="bg-amber-soft mb-4 flex size-13 items-center justify-center rounded-2xl text-amber-700 dark:text-amber-400">
              <File className="size-6.5" />
            </div>
            <h2 className="serif text-[23px] font-semibold tracking-tight">
              {t("report.title", { firstName: first })}
            </h2>
            <p className="text-foreground/70 mt-2.5 text-sm leading-relaxed">
              {t("report.intro")}
            </p>
            <div className="bg-muted mt-4 flex items-center gap-2 rounded-xl p-3.5">
              <Lock className="text-green size-4 shrink-0" />
              <div className="text-foreground/70 text-[12.5px] font-semibold">
                {t("report.privateNote")}
              </div>
            </div>
            <div className="mt-5.5 flex justify-end gap-2.5">
              <Button variant="outline" size="lg" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button size="lg" onClick={() => setStep(1)}>
                {t("common.continue")} <ArrowRight />
              </Button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="serif text-[22px] font-semibold tracking-tight">
              {t("report.uploadTitle")}
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="press bg-card hover:border-primary/50 mt-4 w-full rounded-2xl border-[1.5px] border-dashed p-8 text-center transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <Check className="text-green mx-auto mb-2.5 size-7" />
              ) : (
                <Upload className="text-muted-foreground mx-auto mb-2.5 size-7" />
              )}
              <div className="text-foreground/80 text-sm font-bold">
                {file ? file.name : t("report.chooseFile")}
              </div>
              <div className="text-muted-foreground mt-0.5 text-[12.5px]">
                {t("report.fileHint")}
              </div>
            </button>
            <div className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dod">{t("report.dateLabel")}</Label>
                <Input
                  id="dod"
                  type="date"
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">{t("report.roleLabel")}</Label>
                <Input
                  id="role"
                  value={role}
                  placeholder={t("report.rolePlaceholder")}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>
            {errorKey && (
              <div className="text-destructive mt-2 text-[13px] font-semibold">
                {t(errorKey)}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2.5">
              <Button variant="outline" size="lg" disabled={busy} onClick={() => setStep(0)}>
                {t("common.back")}
              </Button>
              <Button size="lg" disabled={busy} onClick={() => void doSubmit()}>
                <Upload /> {busy ? t("report.submitting") : t("report.submit")}
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="py-1 text-center">
            <div
              className="bg-green-soft text-green mx-auto mb-4 flex size-21 items-center justify-center rounded-full"
              style={{ animation: "wPop .5s ease" }}
            >
              <Check className="size-10.5" strokeWidth={2.4} />
            </div>
            <h2 className="serif text-[22px] font-semibold tracking-tight">
              {t("report.submittedTitle")}
            </h2>
            <p className="text-foreground/70 mt-2.5 text-sm leading-relaxed">
              {t("report.submittedBody")}
            </p>
            <div className="mt-5">
              <Button
                className="bg-espresso w-full text-white hover:bg-espresso/90"
                size="lg"
                onClick={onClose}
              >
                {t("common.done")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
