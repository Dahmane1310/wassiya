import { useTranslation } from "react-i18next"
import { OptionSheet } from "@/components/ui/option-sheet"
import { useSwitch } from "@/hooks/use-switch"
import { isTrialExpired } from "@/lib/entitlement-error"
import { usePaywallStore } from "@/stores/paywall"

const DAY_MS = 24 * 60 * 60 * 1000
const CADENCE_DAYS = [7, 14, 30, 60, 90]
const GRACE_DAYS = [7, 14, 30]

/** Cadence / grace-period picker for the dead-man's switch. Edits config via
 *  `updateConfig` (which re-times the deadline WITHOUT recording a check-in), so a
 *  preference change never masquerades as a heartbeat. */
export function SwitchConfigSheet({
  open,
  onClose,
  kind,
}: {
  open: boolean
  onClose: () => void
  kind: "cadence" | "grace"
}) {
  const { t } = useTranslation()
  const sw = useSwitch()
  const showPaywall = usePaywallStore((s) => s.show)
  const isCadence = kind === "cadence"

  const days = isCadence ? CADENCE_DAYS : GRACE_DAYS
  const current = isCadence ? sw.cadenceDays : sw.graceDays

  return (
    <OptionSheet
      open={open}
      onClose={onClose}
      title={t(isCadence ? "profile.cadence" : "profile.grace")}
      subtitle={t(isCadence ? "profile.cadenceSubtitle" : "profile.graceSubtitle")}
      selectedKey={String(current)}
      options={days.map((d) => ({
        key: String(d),
        label: isCadence
          ? t("cadence.everyDays", { days: d })
          : t("profile.daysValue", { days: d }),
      }))}
      onSelect={(key) => {
        const d = Number(key)
        const intervalMs = isCadence ? d * DAY_MS : sw.cadenceDays * DAY_MS
        const graceMs = isCadence ? sw.graceDays * DAY_MS : d * DAY_MS
        // Reactive only: lazy first-arm (no switch yet + expired) throws TRIAL_EXPIRED.
        // An existing switch hits the ungated re-time path and never throws.
        void sw.updateConfig(intervalMs, graceMs).catch((err: unknown) => {
          if (isTrialExpired(err)) showPaywall()
        })
        onClose()
      }}
    />
  )
}
