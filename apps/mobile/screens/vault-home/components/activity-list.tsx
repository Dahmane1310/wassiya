import { View } from "react-native"
import {
  CalendarCheck,
  FileCheck,
  FileText,
  Layers,
  Pencil,
  ScrollText,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Vault,
  type LucideIcon,
} from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { type TFunction } from "i18next"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { IconBadge } from "@/components/ui/icon-badge"
import { SectionLabel } from "@/components/ui/section-label"
import { useThemeColors, type ThemeColors } from "@/lib/colors"

type EventMeta = { icon: LucideIcon; color: keyof ThemeColors }

// Maps an auditLog event to its icon + theme color. Unknown/legacy events fall
// back to a neutral badge so the feed never breaks on an unmapped event.
const EVENTS: Record<string, EventMeta> = {
  check_in: { icon: CalendarCheck, color: "green" },
  vault_unlocked: { icon: Unlock, color: "primary" },
  asset_created: { icon: Layers, color: "primary" },
  asset_updated: { icon: Pencil, color: "primary" },
  asset_deleted: { icon: Trash2, color: "red" },
  asset_read_at_release: { icon: FileText, color: "ink2" },
  beneficiary_invited: { icon: UserPlus, color: "goldDeep" },
  beneficiary_enrolled: { icon: UserCheck, color: "green" },
  executor_invited: { icon: UserPlus, color: "goldDeep" },
  attestation_recorded: { icon: ShieldCheck, color: "green" },
  attestation_revoked: { icon: ShieldOff, color: "red" },
  death_cert_submitted: { icon: ScrollText, color: "gold" },
  death_cert_reviewed: { icon: FileCheck, color: "green" },
  switch_state_changed: { icon: ShieldCheck, color: "green" },
  release_authorized: { icon: Unlock, color: "red" },
}
const FALLBACK: EventMeta = { icon: Vault, color: "ink2" }

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/** Compact "x ago" from a timestamp (ms). Hermes Intl is thin, so we format by
 *  hand against simple buckets rather than `Intl.RelativeTimeFormat`. */
function relativeTime(ts: number, t: TFunction): string {
  const diff = Date.now() - ts
  if (diff < MINUTE) return t("activity.justNow")
  if (diff < HOUR) return t("activity.minutesAgo", { count: Math.floor(diff / MINUTE) })
  if (diff < DAY) return t("activity.hoursAgo", { count: Math.floor(diff / HOUR) })
  if (diff < WEEK) return t("activity.daysAgo", { count: Math.floor(diff / DAY) })
  return t("activity.weeksAgo", { count: Math.floor(diff / WEEK) })
}

/** Recent vault activity feed (check-ins, encryptions, heir/Wasiyyah edits),
 *  read from the owner-scoped `auditLog`. */
export function ActivityList() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const rows = useQuery(api.activity.listActivity, { limit: 8 })

  if (rows === undefined) return null

  return (
    <View>
      <SectionLabel>{t("vaultHome.recentActivity")}</SectionLabel>
      <View className="rounded-2xl border border-border bg-card px-1.5 py-0.5 shadow-sm shadow-black/5">
        {rows.length === 0 ? (
          <Text className="px-3 py-5 font-sans-medium text-[13px] text-ink-3">
            {t("activity.empty")}
          </Text>
        ) : (
          rows.map((a, i) => {
            const meta = EVENTS[a.event] ?? FALLBACK
            return (
              <View
                key={a._id}
                className={cn(
                  "flex-row items-center gap-3 px-3 py-3",
                  i < rows.length - 1 && "border-b border-line-2"
                )}
              >
                <IconBadge icon={meta.icon} color={c[meta.color]} size={38} radius={11} />
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-semibold text-[14.5px] text-foreground">
                    {t(`activity.event.${a.event}`, { defaultValue: t("activity.event.unknown") })}
                  </Text>
                  <Text className="mt-0.5 font-sans-medium text-[12.5px] text-ink-3">
                    {relativeTime(a._creationTime, t)}
                  </Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}
