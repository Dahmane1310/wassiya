import { useState } from "react"
import { ActivityIndicator, Pressable, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { Sheet } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet-header"
import { useThemeColors } from "@/lib/colors"
import type { ExecutorScope } from "@/screens/contacts/hooks/use-contacts"

const SCOPES: ExecutorScope[] = ["full", "attest_only", "debts_only", "coordinate"]
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

/** Add a beneficiary or executor (email + optional private name; executors pick a
 *  scope). The name is encrypted by the caller. */
export function AddContactSheet({
  open,
  onClose,
  kind,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  kind: "beneficiary" | "executor"
  onSubmit: (email: string, name: string, scope: ExecutorScope) => Promise<void>
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [scope, setScope] = useState<ExecutorScope>("full")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setEmail("")
    setName("")
    setScope("full")
    setError(null)
    onClose()
  }

  async function submit() {
    if (!emailOk(email) || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(email.trim(), name, scope)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader
        title={t(kind === "beneficiary" ? "contacts.addBeneficiary" : "contacts.addExecutor")}
        subtitle={t(`contacts.${kind}Sub`)}
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
            className="h-full flex-1 font-sans text-[15.5px] text-foreground"
          />
        </Field>

        <Field label={t("contacts.name")}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("contacts.namePlaceholder")}
            placeholderTextColor={c.ink3}
            autoCapitalize="words"
            className="h-full flex-1 font-sans text-[15.5px] text-foreground"
          />
        </Field>

        {kind === "executor" ? (
          <>
            <Text className="mb-2 mt-1 font-sans-semibold text-[12.5px] text-ink-2">{t("contacts.scope")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {SCOPES.map((s) => {
                const on = scope === s
                return (
                  <Pressable
                    key={s}
                    onPress={() => setScope(s)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 active:opacity-80",
                      on ? "border-gold-deep bg-gold-soft" : "border-border bg-card"
                    )}
                  >
                    <Text className={cn("font-heading text-[12.5px]", on ? "text-gold-deep" : "text-foreground")}>
                      {t(`contacts.scope_${s}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        ) : null}

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
