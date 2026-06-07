import { useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PinPad } from "@/components/ui/pin-pad"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useVault } from "@/hooks/use-vault"
import { WrongPinError } from "@/lib/vault"

const PIN_LENGTH = 6
type Stage = "old" | "new" | "confirm"

/** Change the device PIN: verify the current PIN, then set + confirm a new one.
 *  The master key is unchanged, so biometric + recovery stay valid. */
export function ChangePinSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { changePin } = useVault()
  const [stage, setStage] = useState<Stage>("old")
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setStage("old")
    setOldPin("")
    setNewPin("")
    setPin("")
    setError(null)
    setBusy(false)
  }

  function close() {
    reset()
    onClose()
  }

  async function complete(full: string) {
    if (stage === "old") {
      setOldPin(full)
      setPin("")
      setError(null)
      setStage("new")
      return
    }
    if (stage === "new") {
      setNewPin(full)
      setPin("")
      setError(null)
      setStage("confirm")
      return
    }
    // confirm
    if (full !== newPin) {
      setError(t("profile.changePinMismatch"))
      setPin("")
      setNewPin("")
      setStage("new")
      return
    }
    setBusy(true)
    try {
      await changePin(oldPin, full)
      close()
    } catch (err) {
      // A wrong CURRENT PIN only surfaces here (it gates the unwrap). Restart.
      setError(
        err instanceof WrongPinError
          ? t("profile.changePinWrongCurrent")
          : t("asset.error.save")
      )
      setOldPin("")
      setNewPin("")
      setPin("")
      setStage("old")
      setBusy(false)
    }
  }

  const heading =
    stage === "old"
      ? t("profile.changePinCurrent")
      : stage === "new"
        ? t("profile.changePinNew")
        : t("profile.changePinConfirm")

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader title={t("profile.changePin")} onClose={close} />
      <View className="items-center gap-8 px-5 pb-6 pt-2">
        <Text className="text-center font-display text-[18px] text-foreground">
          {heading}
        </Text>
        {error ? (
          <Text className="text-center font-sans-medium text-[13px] text-danger">
            {error}
          </Text>
        ) : null}
        {busy ? (
          <ActivityIndicator />
        ) : (
          <PinPad
            value={pin}
            onChange={(next) => {
              setPin(next)
              if (error) setError(null)
            }}
            length={PIN_LENGTH}
            onComplete={(full) => void complete(full)}
            error={error !== null}
          />
        )}
      </View>
    </Sheet>
  )
}
