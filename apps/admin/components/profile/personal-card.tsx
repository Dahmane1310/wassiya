"use client"

import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
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

/** Inline edit of the signed-in admin's own name + sign-in email. Drafts are
 *  lazy (null = show the server value) so the form prefills without effects. */
export function PersonalCard() {
  const { t } = useTranslation()
  const me = useQuery(api.admin.profile.getMyProfile)
  const update = useAction(api.admin.profile.updateMyProfile)
  const [firstDraft, setFirstDraft] = useState<string | null>(null)
  const [lastDraft, setLastDraft] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const parts = (me?.name ?? "").split(/\s+/).filter(Boolean)
  const firstName = firstDraft ?? parts[0] ?? ""
  const lastName = lastDraft ?? parts.slice(1).join(" ")
  const email = emailDraft ?? me?.email ?? ""

  async function submit() {
    setBusy(true)
    try {
      await update({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim(),
      })
      toast.success(t("profile.personalSaved"))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      toast.error(
        msg.includes("EMAIL_IN_USE")
          ? t("users.emailInUse")
          : t("profile.personalFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-sm">{t("profile.personal")}</CardTitle>
        <CardDescription>{t("profile.personalBody")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personal-first">{t("users.firstNameLabel")}</Label>
            <Input
              id="personal-first"
              value={firstName}
              disabled={me === undefined}
              onChange={(e) => setFirstDraft(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personal-last">{t("users.lastNameLabel")}</Label>
            <Input
              id="personal-last"
              value={lastName}
              disabled={me === undefined}
              onChange={(e) => setLastDraft(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-email">{t("users.emailLabel")}</Label>
          <Input
            id="personal-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={me === undefined}
            onChange={(e) => setEmailDraft(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="items-center justify-between gap-4 border-t pt-4!">
        <p className="text-muted-foreground max-w-sm text-xs">
          {t("profile.emailVerifyHint")}
        </p>
        <Button
          size="sm"
          disabled={busy || me === undefined || firstName.trim() === "" || !email.includes("@")}
          onClick={() => void submit()}
        >
          <Save /> {t("profile.save")}
        </Button>
      </CardFooter>
    </Card>
  )
}
