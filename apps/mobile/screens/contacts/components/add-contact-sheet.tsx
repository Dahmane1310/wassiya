import { useState } from "react"
import { ActivityIndicator, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Field } from "@/components/ui/field"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useThemeColors } from "@/lib/colors"
import { inputFontClass } from "@/lib/fonts"

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

/** Add a non-heir beneficiary (email + optional private name). The name is
 *  encrypted by the caller. */
export function AddContactSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (email: string, name: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setEmail("")
    setName("")
    setError(null)
    setBusy(false) // reset busy too, or a successful add leaves the button spinning
    onClose()
  }

  async function submit() {
    if (!emailOk(email) || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(email.trim(), name)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader
        title={t("contacts.addBeneficiary")}
        subtitle={t("contacts.beneficiarySub")}
        onClose={close}
      />
      <View className="px-5 pb-3 pt-2">
        <Field label={t("contacts.email")}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("contacts.emailPlaceholder")}
            placeholderTextColor={c.ink3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className={`h-full flex-1 ${inputFontClass} text-[15.5px] text-foreground`}
          />
        </Field>

        <Field label={t("contacts.name")}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("contacts.namePlaceholder")}
            placeholderTextColor={c.ink3}
            autoCapitalize="words"
            className={`h-full flex-1 ${inputFontClass} text-[15.5px] text-foreground`}
          />
        </Field>

        {error ? <Text className="mt-3 font-sans-medium text-[12.5px] text-danger">{error}</Text> : null}

        <Button
          variant="gold"
          className="mt-5 h-[54px] rounded-2xl"
          disabled={!emailOk(email) || busy}
          onPress={() => void submit()}
        >
          {busy ? <ActivityIndicator color="white" /> : <Text className="font-heading text-white">{t("contacts.save")}</Text>}
        </Button>
      </View>
    </Sheet>
  )
}
