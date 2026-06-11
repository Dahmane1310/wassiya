"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function AddAdminDialog() {
  const { t } = useTranslation()
  const add = useMutation(api.admin.admins.addAdmin)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await add({ email: email.trim(), note: note.trim() || undefined })
      toast.success(t("admins.invited", { email: email.trim() }))
      setOpen(false)
      setEmail("")
      setNote("")
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("ALREADY_ADMIN")
          ? t("admins.alreadyAdmin")
          : t("admins.inviteFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> {t("admins.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admins.addTitle")}</DialogTitle>
          <DialogDescription>
            {t("admins.addBody")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-email">{t("admins.emailLabel")}</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="person@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-note">{t("admins.noteLabel")}</Label>
            <Input
              id="admin-note"
              placeholder={t("admins.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={busy || !email.includes("@")} onClick={() => void submit()}>
            {t("admins.invite")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
