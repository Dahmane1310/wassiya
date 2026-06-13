"use client"

import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const EVENTS: Record<string, { className?: string }> = {
  vault_unlocked: {},
  asset_created: {},
  asset_updated: {},
  asset_deleted: { className: "text-destructive" },
  asset_read_at_release: {},
  beneficiary_invited: {},
  beneficiary_enrolled: {},
  recipient_key_rotated: { className: "text-amber-700 dark:text-amber-400" },
  executor_invited: {},
  attestation_recorded: {},
  attestation_revoked: {},
  death_cert_submitted: { className: "text-amber-700 dark:text-amber-400" },
  death_cert_reviewed: { className: "text-amber-700 dark:text-amber-400" },
  death_review_reopened: { className: "text-amber-700 dark:text-amber-400" },
  check_in: { className: "text-green-700 dark:text-green-400" },
  switch_state_changed: {},
  release_authorized: { className: "text-blue-700 dark:text-blue-400" },
  entitlement_granted: {},
  entitlement_revoked: { className: "text-destructive" },
  admin_added: {},
  admin_removed: { className: "text-destructive" },
  account_created: {},
  account_updated: {},
  account_disabled: { className: "text-destructive" },
  account_enabled: { className: "text-green-700 dark:text-green-400" },
  account_deleted: { className: "text-destructive" },
  notification_retried: {},
  landing_published: { className: "text-blue-700 dark:text-blue-400" },
  landing_draft_discarded: {},
  integration_updated: {},
}

/** The full known-event list — drives the audit page's filter dropdown. */
export const AUDIT_EVENTS = Object.keys(EVENTS)

export function EventBadge({ event }: { event: string }) {
  const { t } = useTranslation()
  const e = EVENTS[event] ?? {}
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", e.className)}>
      {t(`audit.events.${event}`, { defaultValue: event })}
    </Badge>
  )
}
