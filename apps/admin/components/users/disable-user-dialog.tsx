"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Ban } from "lucide-react"
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

/** Superadmin-only reversible disable: blocks every owner-facing call, pauses the
 *  switch, keeps the account + vault data so re-enabling restores access. */
export function DisableUserDialog({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation()
  const disable = useMutation(api.admin.users.adminDisableUser)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await disable({ ownerId, reason: reason.trim() || undefined })
      toast.success(t("users.disabledToast"))
      setOpen(false)
      setReason("")
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("INVALID_STATE")
          ? t("users.disableBlocked")
          : t("users.disableFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <Ban /> {t("users.disableAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.disableTitle")}</DialogTitle>
          <DialogDescription>{t("users.disableBody")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="disable-reason">{t("users.disableReasonLabel")}</Label>
          <Input
            id="disable-reason"
            placeholder={t("users.disableReasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            onClick={() => void submit()}
          >
            {t("users.disableConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
