"use client"

import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Btn, Field, Modal } from "./ui"
import { Icon } from "./icon"

/**
 * Report a death → submit a certificate for admin review. Any enrolled beneficiary
 * of the owner may report; nothing releases on their word alone (an admin approves).
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
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [role, setRole] = useState("")
  const [dateOfDeath, setDateOfDeath] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const generateUrl = useMutation(api.release.generateCertUploadUrl)
  const submit = useMutation(api.release.submitDeathReport)
  const first = ownerName.split(" ")[0]

  const MAX_FILE_BYTES = 10 * 1024 * 1024

  function pickFile(f: File | null) {
    setError("")
    if (f && f.size > MAX_FILE_BYTES) {
      setFile(null)
      setError("That file is larger than 10 MB — please use a smaller photo or PDF.")
      return
    }
    setFile(f)
  }

  async function doSubmit() {
    setBusy(true)
    setError("")
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
      setError("Couldn't submit. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} width={480}>
      {step === 0 && (
        <div style={{ padding: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--amber-soft)", color: "oklch(0.5 0.13 60)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="file" size={26} /></div>
          <h2 className="serif" style={{ fontSize: 23, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Report the passing of {first}</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 10, fontWeight: 500 }}>This begins the verification process. You&apos;ll upload a death certificate, which a Wassiya reviewer checks before anything is released. Nothing is released on your word alone.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 13, background: "var(--surface-2)", borderRadius: 12, marginTop: 16 }}><Icon name="lock" size={17} style={{ color: "var(--green)" }} /><div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>The certificate is reviewed privately — it is never added to the vault.</div></div>
          <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="gold" iconR="arrowR" onClick={() => setStep(1)}>Continue</Btn></div>
        </div>
      )}
      {step === 1 && (
        <div style={{ padding: 28 }}>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Upload the certificate</h2>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          <button className="press" onClick={() => fileRef.current?.click()} style={{ width: "100%", border: "1.5px dashed var(--line)", borderRadius: 14, padding: 34, textAlign: "center", color: "var(--ink-3)", marginTop: 16, background: "var(--surface)" }}>
            <Icon name={file ? "check" : "upload"} size={30} style={{ margin: "0 auto 10px", color: file ? "var(--green)" : "var(--ink-3)" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{file ? file.name : "Choose the death certificate"}</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>PDF or photo · up to 10 MB · sent securely</div>
          </button>
          <div style={{ marginTop: 16 }}>
            <Field label="Date of passing (if known)" type="date" value={dateOfDeath} onChange={setDateOfDeath} />
            <Field label="Your relationship / role" value={role} onChange={setRole} placeholder="e.g. son, named executor" />
          </div>
          {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={() => setStep(0)}>Back</Btn><Btn variant="gold" icon="upload" disabled={busy} onClick={doSubmit}>{busy ? "Submitting…" : "Submit for review"}</Btn></div>
        </div>
      )}
      {step === 2 && (
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ width: 84, height: 84, borderRadius: 99, background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "wPop .5s ease" }}><Icon name="check" size={42} sw={2.4} /></div>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Submitted for review</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 10, fontWeight: 500 }}>A reviewer will verify the certificate. You and the other beneficiaries will be notified of the outcome. Thank you — this is a hard thing to do.</p>
          <div style={{ marginTop: 20 }}><Btn variant="primary" full onClick={onClose}>Done</Btn></div>
        </div>
      )}
    </Modal>
  )
}
