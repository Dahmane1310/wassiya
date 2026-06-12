"use client"

import { useState } from "react"
import Link from "next/link"
import { useAction } from "convex/react"
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
import { subjectOf } from "@/lib/owner-id"

/** Provision a WorkOS account (passwordless — the person signs in with an emailed
 *  one-time code). Shows a success state explaining where the user will appear. */
export function CreateUserDialog() {
  const { t } = useTranslation()
  const create = useAction(api.admin.users.adminCreateUser)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ tokenIdentifier: string; email: string } | null>(null)

  function reset() {
    setEmail("")
    setFirstName("")
    setLastName("")
    setCreated(null)
  }

  async function submit() {
    setBusy(true)
    try {
      const result = await create({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      })
      setCreated(result)
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("EMAIL_IN_USE")
          ? t("users.emailInUse")
          : t("users.createFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> {t("users.createUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {created === null ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("users.createTitle")}</DialogTitle>
              <DialogDescription>{t("users.createBody")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-user-email">{t("users.emailLabel")}</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  placeholder="person@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-user-first">{t("users.firstNameLabel")}</Label>
                  <Input
                    id="new-user-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-user-last">{t("users.lastNameLabel")}</Label>
                  <Input
                    id="new-user-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={busy || !email.includes("@") || firstName.trim() === ""}
                onClick={() => void submit()}
              >
                {t("users.createSubmit")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("users.createdTitle", { email: created.email })}</DialogTitle>
              <DialogDescription>{t("users.createdBody")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("users.createdDone")}
              </Button>
              <Button asChild>
                <Link href={`/users/${subjectOf(created.tokenIdentifier)}`}>
                  {t("users.createdView")}
                </Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
