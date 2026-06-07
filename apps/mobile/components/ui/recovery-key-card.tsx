import { useState } from "react"
import { Pressable, Share, View } from "react-native"
import { Check, Share2, ShieldAlert } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { withoutAutoLock } from "@/lib/auto-lock"

/**
 * Shows the one-time Recovery Key. It is the ONLY way back into the vault on a new
 * device or after a forgotten PIN, and is never recoverable from the server — so the
 * user must save it before continuing (the CTA is gated on an "I've saved it" check).
 * Display-only: the caller owns the code and never persists it in plaintext.
 */
export function RecoveryKeyCard({
  code,
  onContinue,
  cta,
}: {
  code: string
  onContinue: () => void
  cta?: string
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)

  async function share() {
    try {
      await withoutAutoLock(() => Share.share({ message: t("recovery.shareMessage", { code }) }))
    } catch {
      // Dismissed — non-fatal.
    }
  }

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text className="font-display text-[22px] text-foreground">
          {t("recovery.saveTitle")}
        </Text>
        <Text className="font-sans text-[14px] leading-[1.45] text-ink-2">
          {t("recovery.saveBody")}
        </Text>
      </View>

      {/* the code */}
      <View className="items-center gap-4 rounded-2xl border border-border bg-surface-2 px-4 py-6">
        <Text
          selectable
          className="text-center font-mono text-[19px] leading-[1.6] tracking-[2px] text-foreground"
        >
          {code}
        </Text>
        <Pressable
          onPress={() => void share()}
          className="flex-row items-center gap-2 rounded-full bg-card px-4 py-2 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={t("recovery.share")}
        >
          <Icon as={Share2} size={16} className="text-primary" />
          <Text className="font-heading text-[13px] text-primary">
            {t("recovery.share")}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-start gap-2.5 rounded-2xl bg-red-soft p-3.5">
        <Icon as={ShieldAlert} size={18} className="text-danger" />
        <Text className="flex-1 font-sans-medium text-[12.5px] leading-[1.4] text-danger">
          {t("recovery.warning")}
        </Text>
      </View>

      {/* saved confirmation gate */}
      <Pressable
        onPress={() => setSaved((s) => !s)}
        className="flex-row items-center gap-3 active:opacity-70"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: saved }}
      >
        <View
          className={cn(
            "h-6 w-6 items-center justify-center rounded-md border-2",
            saved ? "border-primary bg-primary" : "border-line-2 bg-transparent"
          )}
        >
          {saved ? <Icon as={Check} size={15} className="text-white" /> : null}
        </View>
        <Text className="flex-1 font-sans-medium text-[13.5px] text-foreground">
          {t("recovery.saved")}
        </Text>
      </Pressable>

      <Button
        variant="vault"
        size="lg"
        className="h-[54px] rounded-2xl"
        disabled={!saved}
        onPress={onContinue}
      >
        <Text className="font-heading text-white">
          {cta ?? t("recovery.continue")}
        </Text>
      </Button>
    </View>
  )
}
