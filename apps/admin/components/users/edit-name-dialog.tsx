"use client"

import { useState } from "react"
import { useAction } from "convex/react"
import { Pencil } from "lucide-react"
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

type Props = {
  ownerId: string
  currentName: string | null
}

/** Support fix for a typo'd display name (WorkOS profile; email stays immutable). */
export function EditNameDialog({ ownerId, currentName }: Props) {
  const { t } = useTranslation()
  const update = useAction(api.admin.users.adminUpdateUserName)
  const [open, setOpen] = useState(false)
  const parts = (currentName ?? "").split(/\s+/).filter(Boolean)
  const [firstName, setFirstName] = useState(parts[0] ?? "")
  const [lastName, setLastName] = useState(parts.slice(1).join(" "))
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await update({
        ownerId,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      })
      toast.success(t("users.nameUpdated"))
      setOpen(false)
    } catch {
      toast.error(t("users.updateFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> {t("users.editName")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.editNameTitle")}</DialogTitle>
          <DialogDescription>{t("users.editNameBody")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-first">{t("users.firstNameLabel")}</Label>
            <Input
              id="edit-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-last">{t("users.lastNameLabel")}</Label>
            <Input
              id="edit-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={busy || firstName.trim() === ""} onClick={() => void submit()}>
            {t("users.editNameSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
