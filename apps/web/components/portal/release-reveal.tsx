"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
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
import { Btn, Card, Field, IconBadge } from "./ui"
import { Icon, type IconName } from "./icon"

type Payload = {
  label?: string
  category?: string
  value?: number | null
  currency?: string | null
  notes?: string | null
  details?: Record<string, string> | null
  file?: { name: string; mimeType: string | null } | null
}
type Item = { assetId: string; payload: Payload; dek: CryptoKey; fileUrl: string | null; fileIv: string | null }

const CAT_ICON: Record<string, { icon: IconName; tint: string }> = {
  real_estate: { icon: "home", tint: "var(--primary)" },
  bank_account: { icon: "bank", tint: "var(--green)" },
  cash: { icon: "coins", tint: "var(--gold-deep)" },
  vehicle: { icon: "car", tint: "oklch(0.52 0.11 285)" },
  crypto: { icon: "bitcoin", tint: "var(--gold)" },
  document: { icon: "doc", tint: "oklch(0.52 0.06 255)" },
}
const catMeta = (c?: string) => CAT_ICON[c ?? ""] ?? { icon: "doc" as IconName, tint: "var(--ink-3)" }

function secretLine(p: Payload): string {
  if (p.notes) return p.notes
  if (p.details) {
    const first = Object.values(p.details).find(Boolean)
    if (first) return first
  }
  if (p.value != null) return `${p.currency ?? ""} ${p.value}`.trim()
  return "—"
}

export function ReleaseReveal({
  ownerId,
  ownerName,
  onClose,
}: {
  ownerId: string
  ownerName: string
  onClose: () => void
}) {
  const legacy = useQuery(api.release.getReleasedLegacy, { ownerId })
  const [code, setCode] = useState("")
  const [items, setItems] = useState<Item[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function unlock() {
    if (!legacy) return
    setBusy(true)
    setError("")
    try {
      const recKey = await deriveKeyFromPassword(normalizeRecoveryCode(code), legacy.escrow.recoverySalt)
      let pkcs8: Uint8Array<ArrayBuffer>
      try {
        pkcs8 = await unwrapKey(legacy.escrow.wrappedPrivateKey, legacy.escrow.wrappedPrivateKeyIv, recKey)
      } catch {
        setError("That recovery code didn't work. Check it and try again.")
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
      setError("Something went wrong while opening it. Please try again.")
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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--bg)", overflow: "auto" }} className="w-fade portal">
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "30px 24px 70px" }}>
        <button className="press" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--ink-2)", fontSize: 14, fontWeight: 600, marginBottom: 22 }}><Icon name="chevL" size={17} sw={2.4} /> Close</button>

        <div style={{ background: "linear-gradient(150deg, var(--sidebar), oklch(0.17 0.012 60))", borderRadius: "var(--r-lg)", padding: 32, color: "#fff", position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 170, height: 170, borderRadius: 999, background: "radial-gradient(circle, color-mix(in oklch, var(--gold) 35%, transparent), transparent 70%)" }} />
          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><div style={{ width: 66, height: 66, borderRadius: 99, background: "rgba(255,255,255,0.1)", border: "1.5px solid var(--gold)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", animation: "wPop .6s ease" }}><Icon name="lockOpen" size={30} /></div></div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>{ownerName}&apos;s legacy is released to you</div>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.62)", marginTop: 8, lineHeight: 1.6, fontWeight: 500 }}>Opened privately on your device — for you alone. May Allah have mercy on them.</p>
          </div>
        </div>

        {legacy === undefined && <Card pad={24}><p style={{ fontSize: 14, color: "var(--ink-3)" }}>Loading…</p></Card>}
        {legacy === null && <Card pad={24}><p style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 600 }}>This legacy isn&apos;t available to view yet.</p></Card>}

        {legacy && items === null && (
          <Card pad={24}>
            <h3 className="serif" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Enter your Recovery Code</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 6, fontWeight: 500, lineHeight: 1.5 }}>This opens what was left for you, privately on this device. We never see your code.</p>
            <div style={{ marginTop: 14 }}><Field label="Recovery Code" value={code} onChange={setCode} placeholder="WASIYA-••••-••••-••••-••••" mono /></div>
            {error && <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 8 }}>{error}</div>}
            <Btn variant="blue" size="lg" full icon="lockOpen" disabled={busy || code.trim().length < 8} onClick={unlock}>{busy ? "Opening…" : "Open my legacy"}</Btn>
          </Card>
        )}

        {items !== null && (
          <Card pad={0}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", fontSize: 13, fontWeight: 800, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: 0.3 }}>Left for you</div>
            {items.length === 0 && <div style={{ padding: 20, fontSize: 14, color: "var(--ink-3)" }}>No items were sealed for you.</div>}
            {items.map((it, i) => {
              const c = catMeta(it.payload.category)
              return (
                <div key={it.assetId} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 20px", borderBottom: i < items.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                  <IconBadge name={c.icon} tint={c.tint} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{it.payload.label ?? "Item"}</div>
                    <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{secretLine(it.payload)}</div>
                  </div>
                  {it.fileUrl && it.fileIv && <Btn size="sm" variant="ghost" icon="download" onClick={() => void download(it)}>File</Btn>}
                </div>
              )
            })}
          </Card>
        )}

        {items !== null && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", background: "var(--surface-2)", borderRadius: 13 }}><Icon name="info" size={17} style={{ color: "var(--ink-3)" }} /><div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>Distributed by Fara&apos;id with the rest of the estate. Keep these details private.</div></div>
        )}
      </div>
    </div>
  )
}
