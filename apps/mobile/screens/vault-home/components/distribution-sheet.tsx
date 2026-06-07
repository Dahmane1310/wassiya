import { ActivityIndicator, View } from "react-native"
import { AlertTriangle, Layers, Lock, Scale, ScrollText, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { computeFaraid, type Heir as EngineHeir } from "@workspace/faraid"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useDecryptedAssets } from "@/hooks/use-decrypted-assets"
import { Sheet } from "@/components/ui/sheet"
import { heirPalette, useThemeColors } from "@/lib/colors"
import { formatCurrencyAmount } from "@/lib/estate-summary"
import { useDecryptedHeirs } from "@/screens/heirs/hooks/use-decrypted-heirs"
import { useWasiyyah } from "@/screens/wasiyyah/hooks/use-wasiyyah"
import { useMasterKey } from "@/stores/vault"

const MINUS = "−"

function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "•"
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase()
}

/** The release order, as a waterfall: gross → −debts → −Wasiyyah → Fara'id pool,
 *  with real per-heir legal shares. Amounts and heir names both need the master
 *  key, so the preview is shown only when the vault is unlocked. */
export function DistributionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { display, body } = useBrandType()
  const c = useThemeColors()
  const palette = heirPalette(c)
  const masterKey = useMasterKey()
  const { heirs } = useDecryptedHeirs()
  const { summary } = useDecryptedAssets()
  const { allocations } = useWasiyyah()
  const currentUser = useQuery(api.users.currentUser)

  function renderBody() {
    if (masterKey === null) {
      return (
        <View className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card p-4">
          <Lock size={18} color={c.ink2} strokeWidth={1.9} />
          <Text className={cn("flex-1 text-[13px] leading-[1.4] text-ink-2", body)}>
            {t("dist.unlockToPreview")}
          </Text>
        </View>
      )
    }
    if (heirs === null || allocations === null) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator />
        </View>
      )
    }
    const primary = summary.primary
    if (primary === null) {
      return (
        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className={cn("text-[13px] leading-[1.4] text-ink-2", body)}>
            {t("dist.noValues")}
          </Text>
        </View>
      )
    }

    const { currency } = primary
    const wasiyyahFraction = allocations.reduce((s, a) => s + a.percentage, 0) / 100
    const wasiyyahAmount = wasiyyahFraction * primary.net
    const faraidPool = primary.net - wasiyyahAmount

    const steps = [
      { key: "gross", value: primary.assets, color: c.ink, icon: Layers },
      { key: "debts", value: -primary.debts, color: c.red, icon: Scale },
      { key: "wasiyyah", value: -wasiyyahAmount, color: c.goldDeep, icon: ScrollText },
      { key: "pool", value: faraidPool, color: c.primary, icon: Users, total: true },
    ]

    const faraid = computeFaraid({
      deceasedGender: currentUser?.ownerGender ?? undefined,
      heirs: heirs.map<EngineHeir>((h) => ({
        id: h.id,
        relationship: h.relationship,
        lineage: h.lineage ?? undefined,
        gender: h.gender,
        isAlive: h.isAlive,
      })),
    })
    const shares = faraid.status === "ok" ? faraid.shares : []
    const nameOf = new Map(heirs.map((h) => [h.id as string, h.name]))
    const relOf = new Map(heirs.map((h) => [h.id as string, h.relationship]))

    return (
      <>
        <View className="rounded-2xl border border-border bg-card px-4">
          {steps.map((s, i) => (
            <View
              key={s.key}
              className={cn(
                "flex-row items-center gap-3 py-3.5",
                i < steps.length - 1 && "border-b border-line-2"
              )}
            >
              <View
                style={{ backgroundColor: s.color + "1f" }}
                className="h-8 w-8 items-center justify-center rounded-[9px]"
              >
                <s.icon size={17} color={s.color} strokeWidth={1.9} />
              </View>
              <Text
                className={cn(
                  "flex-1 text-[14px]",
                  s.total ? "font-heading-bold text-foreground" : "font-sans-semibold text-ink-2"
                )}
              >
                {t(`dist.${s.key}`)}
              </Text>
              <Text className="font-mono text-[14px]" style={{ color: s.color }}>
                {s.value < 0 ? MINUS : ""}
                {formatCurrencyAmount(currency, Math.abs(s.value), true)}
              </Text>
            </View>
          ))}
        </View>

        {summary.currencies.length > 1 ? (
          <Text className={cn("mt-2 text-[11.5px] leading-[1.4] text-ink-3", body)}>
            {t("dist.primaryCurrencyNote", { currency })}
          </Text>
        ) : null}

        <Text className="mb-2 mt-4 font-sans-semibold text-[13px] uppercase tracking-wide text-ink-3">
          {t("dist.heirsReceive")}
        </Text>
        {faraid.status !== "ok" ? (
          <View className="flex-row items-start gap-2.5 rounded-2xl bg-gold-soft p-3.5">
            <AlertTriangle size={18} color={c.goldDeep} strokeWidth={1.9} />
            <Text className={cn("flex-1 text-[12.5px] leading-[1.4] text-gold-deep", body)}>
              {t("dist.reviewHeirs")}
            </Text>
          </View>
        ) : shares.length === 0 ? (
          <View className="rounded-2xl border border-border bg-card p-4">
            <Text className={cn("text-[13px] leading-[1.4] text-ink-2", body)}>
              {t("dist.noHeirs")}
            </Text>
          </View>
        ) : (
          <View className="rounded-2xl border border-border bg-card px-4">
            {shares.map((s, i) => (
              <View
                key={s.heirId}
                className={cn(
                  "flex-row items-center gap-3 py-2.5",
                  i < shares.length - 1 && "border-b border-line-2"
                )}
              >
                <View
                  style={{ backgroundColor: palette[i % palette.length] + "29" }}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Text className="font-heading text-[12px]" style={{ color: palette[i % palette.length] }}>
                    {initialsOf(nameOf.get(s.heirId) ?? null)}
                  </Text>
                </View>
                <Text className="flex-1 font-sans-semibold text-[14px] text-foreground">
                  {nameOf.get(s.heirId) ?? "—"}{" "}
                  <Text className="font-sans text-ink-3">
                    · {t(`heirRel.${relOf.get(s.heirId)}`)}
                  </Text>
                </Text>
                <View className="items-end">
                  <Text className="font-mono text-[13.5px] text-foreground">
                    {formatCurrencyAmount(currency, s.fraction * faraidPool, true)}
                  </Text>
                  <Text className="font-heading text-[11px] text-ink-3">
                    {s.numerator}/{s.denominator}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mt-4 flex-row items-center gap-2.5 rounded-2xl bg-green-soft p-3.5">
          <Lock size={18} color={c.green} strokeWidth={1.9} />
          <Text className={cn("flex-1 text-[12.5px] leading-[1.4] text-green", body)}>
            {t("dist.releaseNote")}
          </Text>
        </View>
      </>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} scroll>
      <View className="px-5 pb-2 pt-2.5">
        <Text className={cn("text-[23px] text-foreground", display)}>{t("dist.title")}</Text>
        <Text className={cn("mt-0.5 text-[13.5px] text-ink-2", body)}>{t("dist.subtitle")}</Text>
      </View>
      <View className="px-5 pb-2">{renderBody()}</View>
    </Sheet>
  )
}
