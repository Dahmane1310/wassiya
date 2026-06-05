import { View } from "react-native"
import { Layers, Lock, Scale, ScrollText, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { Sheet } from "@/components/ui/sheet"
import { heirPalette, useThemeColors } from "@/lib/colors"
import {
  FAMILY,
  faraid,
  fmtShort,
  netEstate,
  totalDebts,
  totalEstate,
  WASIYYAH,
} from "@/lib/mock-estate"

/** The release order, as a waterfall: gross → −debts → −Wasiyyah → Fara'id pool. */
export function DistributionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { display, body } = useBrandType()
  const c = useThemeColors()
  const palette = heirPalette(c)
  const wasiyyahAED = WASIYYAH.reduce((s, w) => s + w.pctOfEstate, 0) * netEstate
  const faraidPool = netEstate - wasiyyahAED
  const shares = faraid(FAMILY)

  const steps = [
    { label: t("dist.gross"), value: totalEstate, color: c.ink, icon: Layers },
    { label: t("dist.debts"), value: -totalDebts, color: c.red, icon: Scale },
    { label: t("dist.wasiyyah"), value: -wasiyyahAED, color: c.goldDeep, icon: ScrollText },
    { label: t("dist.pool"), value: faraidPool, color: c.primary, icon: Users, total: true },
  ]
  const recipients = FAMILY.filter((m) => shares[m.id] > 0)

  return (
    <Sheet open={open} onClose={onClose} scroll>
      <View className="px-5 pb-2 pt-2.5">
        <Text className={cn("text-[23px] text-foreground", display)}>{t("dist.title")}</Text>
        <Text className={cn("mt-0.5 text-[13.5px] text-ink-2", body)}>{t("dist.subtitle")}</Text>
      </View>

      <View className="px-5">
        <View className="rounded-2xl border border-border bg-card px-4">
          {steps.map((s, i) => (
            <View
              key={s.label}
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
                {s.label}
              </Text>
              <Text className="font-mono text-[14px]" style={{ color: s.color }}>
                {s.value < 0 ? "−" : ""}
                {fmtShort(Math.abs(s.value))}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 mt-4 font-sans-semibold text-[13px] uppercase tracking-wide text-ink-3">
          {t("dist.heirsReceive")}
        </Text>
        <View className="rounded-2xl border border-border bg-card px-4">
          {recipients.map((m, i) => (
            <View
              key={m.id}
              className={cn(
                "flex-row items-center gap-3 py-2.5",
                i < recipients.length - 1 && "border-b border-line-2"
              )}
            >
              <View
                style={{ backgroundColor: palette[i % palette.length] + "29" }}
                className="h-9 w-9 items-center justify-center rounded-full"
              >
                <Text className="font-heading text-[12px]" style={{ color: palette[i % palette.length] }}>
                  {m.initials}
                </Text>
              </View>
              <Text className="flex-1 font-sans-semibold text-[14px] text-foreground">
                {m.name} <Text className="font-sans text-ink-3">· {m.rel}</Text>
              </Text>
              <Text className="font-mono text-[13.5px] text-foreground">
                {fmtShort(shares[m.id] * faraidPool)}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-4 flex-row items-center gap-2.5 rounded-2xl bg-green-soft p-3.5">
          <Lock size={18} color={c.green} strokeWidth={1.9} />
          <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-green">
            {t("dist.releaseNote")}
          </Text>
        </View>
      </View>
    </Sheet>
  )
}
