"use client"

import {
  Bitcoin,
  Car,
  Coins,
  Download,
  FileText,
  House,
  Landmark,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { IconBadge } from "../ui/icon-badge"

export type Payload = {
  label?: string
  category?: string
  value?: number | null
  currency?: string | null
  notes?: string | null
  details?: Record<string, string> | null
  file?: { name: string; mimeType: string | null } | null
}
export type Item = {
  assetId: string
  payload: Payload
  dek: CryptoKey
  fileUrl: string | null
  fileIv: string | null
}

const CAT_ICON: Record<string, { icon: LucideIcon; tint: string }> = {
  real_estate: { icon: House, tint: "var(--primary)" },
  bank_account: { icon: Landmark, tint: "var(--green)" },
  cash: { icon: Coins, tint: "var(--gold-deep)" },
  vehicle: { icon: Car, tint: "oklch(0.52 0.11 285)" },
  crypto: { icon: Bitcoin, tint: "var(--gold)" },
  document: { icon: FileText, tint: "oklch(0.52 0.06 255)" },
}
const catMeta = (c?: string) =>
  CAT_ICON[c ?? ""] ?? { icon: FileText, tint: "var(--ink-3)" }

function secretLine(p: Payload): string {
  if (p.notes) return p.notes
  if (p.details) {
    const first = Object.values(p.details).find(Boolean)
    if (first) return first
  }
  if (p.value != null) return `${p.currency ?? ""} ${p.value}`.trim()
  return "—"
}

/** One decrypted item in the released list. */
export function ReleasedItemRow({
  item,
  last,
  onDownload,
}: {
  item: Item
  last: boolean
  onDownload: (item: Item) => void
}) {
  const { t } = useTranslation()
  const c = catMeta(item.payload.category)
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3.5",
        !last && "border-b border-[var(--line-2)]",
      )}
    >
      <IconBadge icon={c.icon} tint={c.tint} size={42} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold">
          {item.payload.label ?? t("release.itemFallback")}
        </div>
        <div className="mono text-foreground/70 mt-0.5 text-[12.5px] font-semibold break-words">
          {secretLine(item.payload)}
        </div>
      </div>
      {item.fileUrl && item.fileIv && (
        <Button variant="outline" size="sm" onClick={() => onDownload(item)}>
          <Download /> {t("release.fileButton")}
        </Button>
      )}
    </div>
  )
}
