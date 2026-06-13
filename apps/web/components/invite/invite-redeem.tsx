"use client"

import { useEffect, useState } from "react"
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react"
import { Mail, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { sha256 } from "@workspace/crypto"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { Centered } from "./centered"
import { EnrollFlow } from "./enroll-flow"
import { SignInPanel } from "./sign-in-panel"

/**
 * Beneficiary invite redemption entry. The invite is PREVIEWED before any
 * sign-in (valid / expired / already used + who sent it) via getInviteInfo —
 * the high-entropy link is the capability, so the preview is public.
 * Unauthenticated → branded sign-in panel; authenticated → key setup.
 */
export function InviteRedeem({ token }: { token: string }) {
  const { t } = useTranslation()
  const [tokenHash, setTokenHash] = useState<string | null>(null)
  useEffect(() => {
    void sha256(token).then(setTokenHash)
  }, [token])

  const info = useQuery(
    api.invites.getInviteInfo,
    tokenHash !== null ? { tokenHash } : "skip",
  )

  if (info === undefined) {
    return (
      <div className="portal">
        <Centered>
          <div className="flex justify-center">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        </Centered>
      </div>
    )
  }

  if (info.found === false) {
    return (
      <InviteNotice title={t("invite.invalidTitle")} body={t("invite.invalidBody")} />
    )
  }
  if (info.consumedAt == null && info.expiresAt < Date.now()) {
    return (
      <InviteNotice
        title={t("invite.expiredTitle")}
        body={
          info.ownerName
            ? t("invite.expiredBodyNamed", { ownerName: info.ownerName })
            : t("invite.expiredBody")
        }
      />
    )
  }

  return (
    <div className="portal">
      <AuthLoading>
        <Centered>
          <div className="flex justify-center">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        </Centered>
      </AuthLoading>
      <Unauthenticated>
        <SignInPanel token={token} ownerName={info.ownerName} />
      </Unauthenticated>
      <Authenticated>
        <EnrollFlow token={token} />
      </Authenticated>
    </div>
  )
}

function InviteNotice({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation()
  return (
    <div className="portal">
      <Centered>
        <Card className="py-0">
          <CardContent className="p-8 text-center">
            <div className="bg-amber-soft mx-auto mb-3.5 flex size-13 items-center justify-center rounded-2xl text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-6" />
            </div>
            <h1 className="serif text-[22px] font-semibold tracking-tight">{title}</h1>
            <p className="text-foreground/70 mt-2 text-sm leading-relaxed">{body}</p>
            <div className="text-muted-foreground mt-4.5 flex items-center justify-center gap-2 text-[12.5px]">
              <Mail className="size-3.5" />
              {t("invite.arriveNote")}
            </div>
          </CardContent>
        </Card>
      </Centered>
    </div>
  )
}
