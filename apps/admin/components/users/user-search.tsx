"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "convex/react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { subjectOf } from "@/lib/owner-id"

/** Email lookup via the WorkOS API → jumps straight to the user's detail page. */
export function UserSearch() {
  const { t } = useTranslation()
  const find = useAction(api.admin.users.findUserByEmail)
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  async function search() {
    const q = email.trim()
    if (!q) return
    setBusy(true)
    try {
      const hit = await find({ email: q })
      if (hit === null) toast.info(t("users.searchNone", { email: q }))
      else router.push(`/users/${subjectOf(hit.tokenIdentifier)}`)
    } catch {
      toast.error(t("users.searchFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void search()
      }}
    >
      <Input
        type="email"
        placeholder={t("users.searchPlaceholder")}
        className="bg-background h-9 w-56 rounded-lg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" variant="outline" size="icon" className="size-9" disabled={busy}>
        {busy ? <Spinner className="size-4" /> : <Search className="size-4" />}
      </Button>
    </form>
  )
}
