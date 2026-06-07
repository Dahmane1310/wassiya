import { useState } from "react"
import { Pressable, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { PinPad } from "@/components/ui/pin-pad"
import { useBrandType } from "@/hooks/use-brand-type"
import { WrongPinError } from "@/lib/vault"

const PIN_LENGTH = 6

/** The PIN entry on the unlock screen: a 6-dot pad with an inline biometric key
 *  and a "Forgot PIN?" escape hatch to the Recovery Key flow. */
export function PinUnlockForm({
  onUnlock,
  showBiometric,
  onBiometric,
  onForgot,
}: {
  onUnlock: (pin: string) => Promise<void>
  showBiometric: boolean
  onBiometric: () => void
  onForgot: () => void
}) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function complete(full: string) {
    setBusy(true)
    try {
      // PBKDF2 (210k) runs here. On success the parent navigates away (unmount).
      await onUnlock(full)
    } catch (err) {
      // Wrong PIN (or any unwrap failure) → flash + clear. The error is local;
      // nothing reaches the server.
      void (err instanceof WrongPinError)
      setError(true)
      setPin("")
      setBusy(false)
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-10 self-stretch">
      <View className="items-center gap-2 px-4">
        <Text className="text-center font-display text-[22px] text-foreground">
          {t("unlock.pinHeading")}
        </Text>
        {error ? (
          <Text className={cn("text-center text-[13px] text-danger", body)}>
            {t("unlock.wrongPin")}
          </Text>
        ) : (
          <Text className={cn("text-center text-[13px] text-ink-3", body)}>
            {t("unlock.enterPin")}
          </Text>
        )}
      </View>

      <PinPad
        value={pin}
        onChange={(next) => {
          setPin(next)
          if (error) setError(false)
        }}
        length={PIN_LENGTH}
        onComplete={(full) => void complete(full)}
        showBiometric={showBiometric}
        onBiometric={onBiometric}
        error={error}
        disabled={busy}
      />

      <Pressable
        onPress={onForgot}
        hitSlop={8}
        accessibilityRole="button"
        className="active:opacity-70"
      >
        <Text className="font-heading text-[13.5px] text-primary">
          {t("unlock.forgotPin")}
        </Text>
      </Pressable>
    </View>
  )
}
