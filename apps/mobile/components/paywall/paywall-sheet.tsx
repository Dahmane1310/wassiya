import { Pressable, View } from "react-native"
import { Crown } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useBrandType } from "@/hooks/use-brand-type"
import { useEntitlement } from "@/hooks/use-entitlement"
import { useThemeColors } from "@/lib/colors"
import { usePaywallStore } from "@/stores/paywall"

/** One display-only plan row (no checkout yet — purchases land in the web pass). */
function PlanCard({ name, price }: { name: string; price: string }) {
  const { display, body } = useBrandType()
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5">
      <Text className={cn("text-[15px] text-foreground", display)}>{name}</Text>
      <Text className={cn("text-[14px] text-gold-deep", body)}>{price}</Text>
    </View>
  )
}

/**
 * The single, app-wide paywall. INFORMATIONAL only this pass: it shows the trial
 * status and the two plans, and points the user to the web — no in-app checkout yet
 * (that's the web-Stripe pass). Visibility is driven by `usePaywallStore`; one instance
 * is mounted app-wide (app/_layout.tsx).
 */
export function PaywallSheet() {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const c = useThemeColors()
  const open = usePaywallStore((s) => s.open)
  const hide = usePaywallStore((s) => s.hide)
  const ent = useEntitlement()
  const devSet = useMutation(api.entitlements.devSetEntitlement)

  const statusLine = ent.isExpired
    ? t("paywall.trialEnded")
    : ent.isTrialing
      ? t("paywall.daysLeft", { days: ent.trialDaysLeft })
      : null

  return (
    <Sheet open={open} onClose={hide}>
      <SheetHeader title={t("paywall.title")} onClose={hide} />
      <View className="px-5 pb-3 pt-1">
        <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-gold-soft px-4 py-3.5">
          <Crown size={20} color={c.goldDeep} strokeWidth={2} />
          {statusLine ? (
            <Text className={cn("flex-1 text-[14px] text-gold-deep", body)}>{statusLine}</Text>
          ) : null}
        </View>

        <View className="gap-2.5">
          <PlanCard name={t("paywall.annual")} price={t("paywall.annualPrice")} />
          <PlanCard name={t("paywall.lifetime")} price={t("paywall.lifetimePrice")} />
        </View>

        <Text className={cn("mt-4 text-center text-[12.5px] leading-[1.5] text-ink-3", body)}>
          {t("paywall.manageOnWeb")}
        </Text>

        <Button variant="gold" className="mt-4 h-[54px] rounded-2xl" onPress={hide}>
          <Text className="font-heading text-white">{t("paywall.dismiss")}</Text>
        </Button>

        {__DEV__ ? <DevSimulatePanel onRun={(state) => void devSet({ state }).then(hide)} /> : null}
      </View>
    </Sheet>
  )
}

/** DEV-ONLY: drive entitlement state without RevenueCat/stores (see
 *  entitlements.devSetEntitlement, env-guarded). Stripped from release builds via __DEV__. */
function DevSimulatePanel({
  onRun,
}: {
  onRun: (state: "trial" | "annual" | "lifetime" | "expired") => void
}) {
  const states = ["trial", "annual", "lifetime", "expired"] as const
  return (
    <View className="mt-5 rounded-2xl border border-dashed border-border p-3">
      <Text className="mb-2 font-sans-semibold text-[11px] uppercase text-ink-3">
        Dev · simulate entitlement
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {states.map((s) => (
          <Pressable
            key={s}
            onPress={() => onRun(s)}
            className="rounded-lg bg-surface-3 px-3 py-2 active:opacity-70"
          >
            <Text className="font-sans-medium text-[12px] text-foreground">{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
