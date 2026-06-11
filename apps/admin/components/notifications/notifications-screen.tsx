"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { DebouncedInput } from "@/components/shared/debounced-input"
import {
  NotificationsTable,
  type NotificationKind,
  type NotificationStatus,
} from "./notifications-table"

const ALL = "all"
const KINDS: NotificationKind[] = [
  "beneficiary_invite",
  "executor_invite",
  "heartbeat_warning",
  "attestation_request",
  "death_review_result",
  "release_notice",
]

export function NotificationsScreen() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string>(ALL)
  const [kind, setKind] = useState<string>(ALL)
  const [recipient, setRecipient] = useState("")
  const dirty = kind !== ALL || recipient !== ""

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("notifications.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("notifications.subtitle")}
        </p>
      </div>
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value={ALL}>{t("notifications.tabAll")}</TabsTrigger>
          <TabsTrigger value="pending">{t("notifications.tabPending")}</TabsTrigger>
          <TabsTrigger value="sent">{t("notifications.tabSent")}</TabsTrigger>
          <TabsTrigger value="failed">{t("notifications.tabFailed")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <NotificationsTable
        status={status === ALL ? undefined : (status as NotificationStatus)}
        kind={kind === ALL ? undefined : (kind as NotificationKind)}
        recipientEmail={recipient}
        toolbar={
          <>
            <DebouncedInput
              value={recipient}
              onChange={setRecipient}
              placeholder={t("notifications.recipientPlaceholder")}
              className="w-60"
            />
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("notifications.allKinds")}</SelectItem>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`notifications.kinds.${k}`, { defaultValue: k.replaceAll("_", " ") })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setKind(ALL)
                  setRecipient("")
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
