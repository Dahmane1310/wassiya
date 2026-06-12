"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Settings2 } from "lucide-react"
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
import { useAdminSession } from "@/components/panel/admin-context"

export type ConfigureField = {
  key: string // a SETTING_KEYS member
  secret?: boolean
}

type Props = {
  name: string
  fields: ConfigureField[]
  configured: boolean
  /** "panel" enables the remove-panel-values action. */
  source: "panel" | "env" | null
}

/** SUPERADMIN-only settings editor for one integration. Values are write-only:
 *  existing ones are never shown — an empty field keeps the current value. */
export function ConfigureDialog({ name, fields, configured, source }: Props) {
  const { t } = useTranslation()
  const session = useAdminSession()
  const setSetting = useMutation(api.admin.integrations.setIntegrationSetting)
  const clearSetting = useMutation(api.admin.integrations.clearIntegrationSetting)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  if (session?.role !== "superadmin") return null

  const filled = fields.filter((f) => (values[f.key] ?? "").trim() !== "")

  async function save() {
    setBusy(true)
    try {
      for (const f of filled) {
        await setSetting({ key: f.key, value: values[f.key]!.trim() })
      }
      toast.success(t("integrations.settingsSaved"))
      setValues({})
      setOpen(false)
    } catch {
      toast.error(t("integrations.settingsFailed"))
    } finally {
      setBusy(false)
    }
  }

  async function clearAll() {
    setBusy(true)
    try {
      for (const f of fields) await clearSetting({ key: f.key })
      toast.success(t("integrations.settingsCleared"))
      setValues({})
      setOpen(false)
    } catch {
      toast.error(t("integrations.settingsFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 /> {t("integrations.configure")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("integrations.configureTitle", { name })}</DialogTitle>
          <DialogDescription>{t("integrations.configureBody")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`cfg-${f.key}`}>
                {t(`integrations.fields.${f.key}`, { defaultValue: f.key })}
              </Label>
              <Input
                id={`cfg-${f.key}`}
                type={f.secret ? "password" : "text"}
                autoComplete="off"
                placeholder={configured ? "••••••••" : ""}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          {source === "panel" && (
            <Button
              variant="outline"
              className="text-destructive me-auto"
              disabled={busy}
              onClick={() => void clearAll()}
            >
              {t("integrations.clearSettings")}
            </Button>
          )}
          <Button disabled={busy || filled.length === 0} onClick={() => void save()}>
            {t("integrations.saveSettings")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
