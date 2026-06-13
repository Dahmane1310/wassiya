"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { changeMyPassword } from "@/app/profile-actions"

/** Signed-in password change — the current password is checked first. */
export function SecurityCard() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const mismatch = confirm !== "" && next !== confirm

  async function submit() {
    setBusy(true)
    try {
      const result = await changeMyPassword(current, next)
      if ("ok" in result) {
        toast.success(t("account.security.passwordChanged"))
        setCurrent("")
        setNext("")
        setConfirm("")
      } else {
        toast.error(
          result.error === "invalid_credentials"
            ? t("account.security.currentIncorrect")
            : result.error === "password_strength_error"
              ? t("account.security.tooWeak")
              : t("account.security.changeFailed"),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4 gap-4">
      <CardHeader>
        <CardTitle className="text-[14.5px]">{t("account.security.title")}</CardTitle>
        <CardDescription>{t("account.security.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pw-current">{t("account.security.current")}</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-new">{t("account.security.new")}</Label>
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-confirm">{t("account.security.confirm")}</Label>
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={mismatch}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        {mismatch && (
          <p className="text-destructive text-sm">{t("account.security.mismatch")}</p>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={busy || current === "" || next === "" || next !== confirm}
            onClick={() => void submit()}
          >
            <KeyRound /> {t("account.security.changeButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
