"use client"

import { type ReactNode } from "react"
import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Wordmark } from "@/components/portal/logo"

/** Branded split shell for the auth pages: espresso story panel + form column.
 *  Same visual language as the invite enrollment panel. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="portal min-h-screen">
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
            <h1 className="serif text-4xl leading-[1.12] font-semibold tracking-tight">
              {t("auth.shellTitle1")}
              <br />
              {t("auth.shellTitle2")}
            </h1>
            <p className="mt-4 max-w-[380px] text-[15.5px] leading-relaxed font-medium text-white/60">
              {t("auth.shellBody")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-white/50">
            <ShieldCheck className="text-gold size-4.5" /> {t("auth.shellFooter")}
          </div>
        </div>
        <div
          className="flex items-center justify-center px-6 py-10"
          style={{
            background:
              "radial-gradient(900px 600px at 50% -10%, var(--gold-soft), transparent 55%), var(--bg)",
          }}
        >
          <div className="w-up w-[400px] max-w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}
