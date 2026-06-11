"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { KeyRound, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { DebouncedInput } from "@/components/shared/debounced-input"
import { OwnerRef } from "@/components/shared/owner-ref"

/** Support lookup: a beneficiary's email → who named them, enrollment state and
 *  their key fingerprint (for verification calls). */
export function BeneficiaryLookup() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const results = useQuery(
    api.admin.beneficiaries.searchBeneficiaries,
    email.trim() !== "" ? { email } : "skip",
  )

  return (
    <div className="flex flex-col gap-4">
      <DebouncedInput
        value={email}
        onChange={setEmail}
        placeholder={t("beneficiaryLookup.placeholder")}
        className="w-72"
      />
      {email.trim() === "" ? (
        <p className="text-muted-foreground text-sm">
          {t("beneficiaryLookup.intro")}
        </p>
      ) : results === undefined ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : results.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border py-10">
          <SearchX className="size-5" />
          <span className="text-sm">{t("beneficiaryLookup.noResult", { email: email.trim() })}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((b) => (
            <Card key={b._id} className="py-4">
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{b.contactEmail}</span>
                    <Badge
                      variant="secondary"
                      className={
                        b.status === "enrolled"
                          ? "border-transparent bg-green-600/10 text-green-700 dark:text-green-400"
                          : "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }
                    >
                      {t(`userBeneficiaries.${b.status}`, { defaultValue: b.status })}
                    </Badge>
                    {b.linked && <Badge variant="outline">{t("userBeneficiaries.signedUp")}</Badge>}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {t("beneficiaryLookup.namedBy")}{" "}
                    <OwnerRef ownerId={b.ownerId} email={b.ownerEmail ?? b.ownerName} />
                  </div>
                </div>
                {b.keyFingerprint !== null && (
                  <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
                    <KeyRound className="text-primary size-3.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                        {t("beneficiaryLookup.fingerprint")}
                      </div>
                      <div className="max-w-64 truncate font-mono text-xs">
                        {b.keyFingerprint}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
