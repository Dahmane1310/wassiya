"use client"

import { useState } from "react"
import { Save } from "lucide-react"
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
import { updateMyName } from "@/app/profile-actions"

/** Edit your display name. Email stays fixed — it's how the people who named
 *  you reach you. */
export function PersonalCard({
  initialFirst,
  initialLast,
  email,
}: {
  initialFirst: string
  initialLast: string
  email: string
}) {
  const { t } = useTranslation()
  const [first, setFirst] = useState(initialFirst)
  const [last, setLast] = useState(initialLast)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      const result = await updateMyName(first, last)
      if ("ok" in result) toast.success(t("account.personal.nameUpdated"))
      else toast.error(t("account.personal.nameUpdateFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4 gap-4">
      <CardHeader>
        <CardTitle className="text-[14.5px]">{t("account.personal.title")}</CardTitle>
        <CardDescription>{t("account.personal.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acct-first">{t("account.personal.firstName")}</Label>
            <Input id="acct-first" value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acct-last">{t("account.personal.lastName")}</Label>
            <Input id="acct-last" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {t("account.personal.signedInAs")}{" "}
            <span className="font-semibold">{email}</span>
          </p>
          <Button size="sm" disabled={busy || first.trim() === ""} onClick={() => void save()}>
            <Save /> {t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
