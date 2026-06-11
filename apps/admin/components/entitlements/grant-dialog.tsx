"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Gift } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

type Kind = "trial_extension" | "annual" | "lifetime"

/** Manual grant: trial extension / comp annual / comp lifetime. `ownerId` is
 *  prefilled when opened from a user detail page. */
export function GrantDialog({ ownerId: prefill }: { ownerId?: string }) {
  const { t } = useTranslation()
  const grant = useMutation(api.admin.entitlements.adminGrantEntitlement)
  const [open, setOpen] = useState(false)
  const [ownerId, setOwnerId] = useState(prefill ?? "")
  const [kind, setKind] = useState<Kind>("trial_extension")
  const [days, setDays] = useState("30")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!ownerId.trim()) return
    setBusy(true)
    try {
      await grant({
        ownerId: ownerId.trim(),
        grant:
          kind === "trial_extension"
            ? { kind, days: Number(days) || 0 }
            : kind === "annual"
              ? { kind }
              : { kind },
      })
      toast.success(t("entitlements.granted"))
      setOpen(false)
    } catch {
      toast.error(t("entitlements.grantFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Gift /> {t("entitlements.grant")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("entitlements.grantTitle")}</DialogTitle>
          <DialogDescription>
            {t("entitlements.grantBody")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {prefill === undefined && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grant-owner">{t("entitlements.grantOwnerLabel")}</Label>
              <Input
                id="grant-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="https://…|user_…"
                className="font-mono text-xs"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t("entitlements.grantKindLabel")}</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial_extension">{t("entitlements.extendTrial")}</SelectItem>
                <SelectItem value="annual">{t("entitlements.compAnnual")}</SelectItem>
                <SelectItem value="lifetime">{t("entitlements.compLifetime")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "trial_extension" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grant-days">{t("entitlements.daysToAdd")}</Label>
              <Input
                id="grant-days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button disabled={busy || !ownerId.trim()} onClick={() => void submit()}>
            {t("entitlements.grant")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
