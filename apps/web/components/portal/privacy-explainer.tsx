"use client"

import { useState } from "react"
import { Btn, IconBadge, Modal } from "./ui"
import { type IconName } from "./icon"

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: "lock", title: "Locked on your device", body: "Everything is locked privately on your device before it's ever saved." },
  { icon: "shieldCheck", title: "We can't read it", body: "We only ever keep the locked version. No one at Wassiya can see what's inside." },
  { icon: "key", title: "Only you can open it", body: "Only your key — or your recovery code — can open what's left for you." },
]

/** Subtle link that opens the "How your privacy works" details. This is the ONE
 *  place the security story is spelled out, so the main flow stays plain. */
export function PrivacyLink({ label = "How your privacy works" }: { label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="press"
        onClick={() => setOpen(true)}
        style={{ color: "var(--primary)", fontSize: 13, fontWeight: 700 }}
      >
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} width={460}>
        <div style={{ padding: 28 }}>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>
            How your privacy works
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 8, fontWeight: 500 }}>
            Your legacy is private to you and the people you choose — and to no one else.
          </p>
          <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
            {POINTS.map((p) => (
              <div key={p.title} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <IconBadge name={p.icon} tint="var(--primary)" size={40} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 1, lineHeight: 1.5 }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5, fontWeight: 500, marginBottom: 18 }}>
            For the technically curious: everything is sealed with strong end-to-end encryption
            (AES-256 and RSA). Your private key never leaves your device unprotected, and the
            servers only ever hold encrypted data.
          </p>
          <Btn full onClick={() => setOpen(false)}>Got it</Btn>
        </div>
      </Modal>
    </>
  )
}
