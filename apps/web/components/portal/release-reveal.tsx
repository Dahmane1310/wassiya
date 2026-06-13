"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { ChevronLeft, Info, LockOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import {
  base64ToBytes,
  bytesToBase64,
  decryptBytes,
  decryptData,
  deriveKeyFromPassword,
  importDataKey,
  importPrivateKey,
  normalizeRecoveryCode,
  unwrapDekWithPrivateKey,
  unwrapKey,
} from "@workspace/crypto"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { ReleasedItemRow, type Item, type Payload } from "./release/released-item-row"

/** Full-screen reveal of a released legacy. The decryption logic (`unlock`,
 *  `download`) is unchanged — only the shell was restyled. NOT a Dialog:
 *  this is deliberately a takeover moment. Error state holds an i18n KEY. */
export function ReleaseReveal({
  ownerId,
  ownerName,
  onClose,
}: {
  ownerId: string
  ownerName: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const legacy = useQuery(api.release.getReleasedLegacy, { ownerId })
  const [code, setCode] = useState("")
  const [items, setItems] = useState<Item[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState("")

  async function unlock() {
    if (!legacy) return
    setBusy(true)
    setErrorKey("")
    try {
      const recKey = await deriveKeyFromPassword(normalizeRecoveryCode(code), legacy.escrow.recoverySalt)
      let pkcs8: Uint8Array<ArrayBuffer>
      try {
        pkcs8 = await unwrapKey(legacy.escrow.wrappedPrivateKey, legacy.escrow.wrappedPrivateKeyIv, recKey)
      } catch {
        setErrorKey("release.wrongCode")
        setBusy(false)
        return
      }
      const priv = await importPrivateKey(bytesToBase64(pkcs8))
      pkcs8.fill(0)
      const out: Item[] = []
      for (const it of legacy.items) {
        const dekBytes = await unwrapDekWithPrivateKey(it.wrappedKey, priv)
        const dek = await importDataKey(dekBytes)
        dekBytes.fill(0)
        const json = await decryptData(it.payload.ciphertext, it.payload.iv, dek)
        out.push({ assetId: it.assetId, payload: JSON.parse(json) as Payload, dek, fileUrl: it.fileUrl, fileIv: it.fileIv })
      }
      setItems(out)
    } catch {
      setErrorKey("release.openFailed")
    } finally {
      setBusy(false)
    }
  }

  async function download(it: Item) {
    if (!it.fileUrl || !it.fileIv) return
    const res = await fetch(it.fileUrl)
    const buf = new Uint8Array(await res.arrayBuffer())
    const plain = await decryptBytes(bytesToBase64(buf), it.fileIv, it.dek)
    const blob = new Blob([plain as BlobPart], { type: it.payload.file?.mimeType ?? "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = it.payload.file?.name ?? "file"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-fade portal bg-background fixed inset-0 z-[300] overflow-auto">
      <div className="mx-auto max-w-[620px] px-6 pt-7 pb-18">
        <button
          type="button"
          className="press text-foreground/70 hover:text-primary mb-5.5 flex items-center gap-1 text-sm font-semibold transition-colors"
          onClick={onClose}
        >
          <ChevronLeft className="size-4" strokeWidth={2.4} /> {t("common.close")}
        </button>

        <div
          className="relative mb-4 overflow-hidden p-8 text-white"
          style={{
            background: "linear-gradient(150deg, var(--sidebar), oklch(0.17 0.012 60))",
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            className="absolute -top-8 -right-5 size-[170px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--gold) 35%, transparent), transparent 70%)",
            }}
          />
          <div className="relative text-center">
            <div className="mb-3.5 flex justify-center">
              <div
                className="border-gold text-gold flex size-16.5 items-center justify-center rounded-full border-[1.5px] bg-white/10"
                style={{ animation: "wPop .6s ease" }}
              >
                <LockOpen className="size-7.5" />
              </div>
            </div>
            <div className="serif text-2xl font-semibold tracking-tight">
              {t("release.heroTitle", { ownerName })}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed font-medium text-white/60">
              {t("release.heroSub")}
            </p>
          </div>
        </div>

        {legacy === undefined && (
          <Card className="py-0">
            <CardContent className="flex justify-center p-6">
              <Spinner className="text-muted-foreground size-5" />
            </CardContent>
          </Card>
        )}
        {legacy === null && (
          <Card className="py-0">
            <CardContent className="p-6">
              <p className="text-foreground/70 text-sm font-semibold">
                {t("release.notAvailable")}
              </p>
            </CardContent>
          </Card>
        )}

        {legacy && items === null && (
          <Card className="py-0">
            <CardContent className="p-6">
              <h3 className="serif text-lg font-semibold">{t("release.enterCode")}</h3>
              <p className="text-foreground/70 mt-1.5 text-[13.5px] leading-normal">
                {t("release.enterCodeBody")}
              </p>
              <div className="mt-3.5 mb-4 flex flex-col gap-1.5">
                <Label htmlFor="recovery-code">{t("release.recoveryCodeLabel")}</Label>
                <Input
                  id="recovery-code"
                  className="mono h-12"
                  value={code}
                  placeholder={t("release.codePlaceholder")}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {errorKey && (
                <div className="text-destructive mb-2 text-[13px] font-semibold">
                  {t(errorKey)}
                </div>
              )}
              <Button
                size="xl"
                className="w-full bg-[var(--blue)] text-white hover:bg-[var(--blue)]/90"
                disabled={busy || code.trim().length < 8}
                onClick={() => void unlock()}
              >
                <LockOpen /> {busy ? t("release.opening") : t("release.openButton")}
              </Button>
            </CardContent>
          </Card>
        )}

        {items !== null && (
          <Card className="gap-0 py-0">
            <div className="text-muted-foreground border-b px-5 py-4 text-[13px] font-extrabold tracking-wide uppercase">
              {t("release.leftForYou")}
            </div>
            {items.length === 0 && (
              <div className="text-muted-foreground p-5 text-sm">
                {t("release.noItems")}
              </div>
            )}
            {items.map((it, i) => (
              <ReleasedItemRow
                key={it.assetId}
                item={it}
                last={i === items.length - 1}
                onDownload={(item) => void download(item)}
              />
            ))}
          </Card>
        )}

        {items !== null && (
          <div className="bg-muted mt-4 flex items-center gap-2 rounded-2xl px-4 py-3.5">
            <Info className="text-muted-foreground size-4 shrink-0" />
            <div className="text-foreground/70 text-[12.5px] font-semibold">
              {t("release.faraidNote")}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
