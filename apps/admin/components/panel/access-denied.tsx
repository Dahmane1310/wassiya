"use client"

import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { ShieldX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/** Shown to signed-in users who are not on the admin allowlist. UX only —
 *  every admin Convex function rejects them server-side regardless. */
export function AccessDenied() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl">
        <ShieldX className="size-7" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">{t("accessDenied.title")}</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {user?.email
            ? t("accessDenied.bodyWithEmail", { email: user.email })
            : t("accessDenied.body")}
        </p>
      </div>
      <Button variant="outline" onClick={() => void signOut()}>
        {t("common.signOut")}
      </Button>
    </div>
  )
}
