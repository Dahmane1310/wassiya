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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"
import { subjectOf } from "@/lib/owner-id"

type Hit = { tokenIdentifier: string; email: string; name: string | null }

/** Free-text lookup (name, email, or WorkOS id) via the WorkOS API. One hit
 *  jumps straight to the detail page; several open a result list. */
export function UserSearch() {
  const { t } = useTranslation()
  const search = useAction(api.admin.users.searchUsers)
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const [hits, setHits] = useState<Hit[] | null>(null)

  function open(hit: Hit) {
    setHits(null)
    router.push(`/users/${subjectOf(hit.tokenIdentifier)}`)
  }

  async function submit() {
    const q = query.trim()
    if (!q) return
    setBusy(true)
    setHits(null)
    try {
      const results = await search({ query: q })
      if (results.length === 0) toast.info(t("users.searchNone", { query: q }))
      else if (results.length === 1) open(results[0]!)
      else setHits(results)
    } catch {
      toast.error(t("users.searchFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover open={hits !== null} onOpenChange={(o) => !o && setHits(null)}>
      <PopoverAnchor asChild>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <Input
            placeholder={t("users.searchPlaceholder")}
            className="bg-background h-9 w-64 rounded-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon" className="size-9" disabled={busy}>
            {busy ? <Spinner className="size-4" /> : <Search className="size-4" />}
          </Button>
        </form>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-80 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {(hits ?? []).map((hit) => (
          <button
            key={hit.tokenIdentifier}
            type="button"
            onClick={() => open(hit)}
            className="hover:bg-accent flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-start transition-colors"
          >
            <span className="text-sm font-medium">
              {hit.name ?? t("users.unknownUser")}
            </span>
            <span className="text-muted-foreground text-xs">{hit.email}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
