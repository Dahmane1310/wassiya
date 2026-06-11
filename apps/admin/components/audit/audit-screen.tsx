"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { DebouncedInput } from "@/components/shared/debounced-input"
import { AuditTable } from "./audit-table"
import { AUDIT_EVENTS } from "./event-badge"

const ALL = "all"
const DAY_MS = 24 * 60 * 60 * 1000

/** "YYYY-MM-DD" (local) → ms timestamp; end-of-day for the upper bound. */
function dateToMs(date: string, endOfDay: boolean): number | undefined {
  if (!date) return undefined
  const ms = new Date(`${date}T00:00:00`).getTime()
  if (Number.isNaN(ms)) return undefined
  return endOfDay ? ms + DAY_MS - 1 : ms
}

function AuditScreenInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [ownerId, setOwnerId] = useState(searchParams.get("ownerId") ?? "")
  const [event, setEvent] = useState<string>(ALL)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const dirty = ownerId !== "" || event !== ALL || fromDate !== "" || toDate !== ""

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("audit.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("audit.subtitle")}
        </p>
      </div>
      <AuditTable
        ownerId={ownerId.trim()}
        event={event === ALL ? "" : event}
        from={dateToMs(fromDate, false)}
        to={dateToMs(toDate, true)}
        toolbar={
          <>
            <DebouncedInput
              value={ownerId}
              onChange={setOwnerId}
              placeholder={t("audit.ownerIdPlaceholder")}
              className="w-60"
            />
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("audit.allEvents")}</SelectItem>
                {AUDIT_EVENTS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {t(`audit.events.${e}`, { defaultValue: e })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36"
              aria-label={t("audit.fromDate")}
            />
            <span className="text-muted-foreground text-xs">{t("audit.to")}</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36"
              aria-label={t("audit.toDate")}
            />
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setOwnerId("")
                  setEvent(ALL)
                  setFromDate("")
                  setToDate("")
                }}
              >
                <RotateCcw className="size-3.5" /> {t("common.reset")}
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}

export function AuditScreen() {
  return (
    <Suspense>
      <AuditScreenInner />
    </Suspense>
  )
}
