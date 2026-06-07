import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { PinPad } from "@/components/ui/pin-pad"
import { useBrandType } from "@/hooks/use-brand-type"

const PIN_LENGTH = 6

/** Two-stage PIN creation: enter a 6-digit PIN, then re-enter to confirm. Calls
 *  `onSubmit` with the confirmed PIN (the parent runs setup + navigates away). */
export function PinForm({
  onSubmit,
}: {
  onSubmit: (pin: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { body } = useBrandType()
  const [stage, setStage] = useState<"enter" | "confirm">("enter")
  const [first, setFirst] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function complete(full: string) {
    if (stage === "enter") {
      setFirst(full)
      setPin("")
      setStage("confirm")
      return
    }
    if (full !== first) {
      setError(true)
      setPin("")
      setStage("enter")
      setFirst("")
      return
    }
    setBusy(true)
    try {
      // PBKDF2 (210k) + key minting run here, on the final digit — never per tap.
      await onSubmit(full)
    } catch (err) {
      setError(true)
      setPin("")
      setStage("enter")
      setFirst("")
      setBusy(false)
      void err
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-10 self-stretch">
      <View className="items-center gap-2 px-4">
        <Text className="text-center font-display text-[22px] text-foreground">
          {t(stage === "enter" ? "onboarding.enterPin" : "onboarding.confirmPin")}
        </Text>
        {error ? (
          <Text className={cn("text-center text-[13px] text-danger", body)}>
            {t("onboarding.pinMismatch")}
          </Text>
        ) : (
          <Text className={cn("text-center text-[13px] text-ink-3", body)}>
            {t("onboarding.pinHint")}
          </Text>
        )}
      </View>

      {busy ? (
        <ActivityIndicator />
      ) : (
        <PinPad
          value={pin}
          onChange={(next) => {
            setPin(next)
            if (error) setError(false)
          }}
          length={PIN_LENGTH}
          onComplete={(full) => void complete(full)}
          error={error}
        />
      )}
    </View>
  )
}
