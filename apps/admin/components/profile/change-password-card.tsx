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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { changeMyPassword } from "@/app/profile-actions"

/** Signed-in password change: verifies the current password server-side first.
 *  SSO-only accounts (no password yet) are pointed at the sign-in page's
 *  "Forgot password" flow instead. */
export function ChangePasswordCard() {
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
        toast.success(t("profile.passwordChanged"))
        setCurrent("")
        setNext("")
        setConfirm("")
      } else {
        toast.error(t(`profile.errors.${result.error}`))
      }
    } catch {
      toast.error(t("profile.errors.profile_failed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-sm">{t("profile.security")}</CardTitle>
        <CardDescription>{t("profile.securityBody")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pw-current">{t("profile.currentPassword")}</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-new">{t("profile.newPassword")}</Label>
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-confirm">{t("profile.confirmPassword")}</Label>
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
          <p className="text-destructive text-sm">{t("profile.passwordMismatch")}</p>
        )}
      </CardContent>
      <CardFooter className="items-center justify-between gap-4 border-t pt-4!">
        <p className="text-muted-foreground max-w-sm text-xs">{t("profile.ssoHint")}</p>
        <Button
          size="sm"
          disabled={busy || current === "" || next === "" || next !== confirm}
          onClick={() => void submit()}
        >
          <KeyRound /> {t("profile.changePassword")}
        </Button>
      </CardFooter>
    </Card>
  )
}
