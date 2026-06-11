"use client"

import { useQuery } from "convex/react"
import { type TFunction } from "i18next"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { TimeCell } from "@/components/shared/time-cell"

type Share = {
  kind: "faraid" | "wasiyyah"
  heir:
    | { type: "familyMember"; relationship: string; lineage: string | null; gender: string }
    | { type: "beneficiary"; contactEmail: string }
    | { type: "unknown" }
  fractionNumerator: number
  fractionDenominator: number
  percent: number
}

function heirLabel(heir: Share["heir"], t: TFunction): string {
  if (heir.type === "beneficiary") return heir.contactEmail
  if (heir.type === "familyMember") {
    const lineage =
      heir.lineage !== null
        ? ` · ${t("releases.lineageSuffix", { lineage: heir.lineage })}`
        : ""
    return `${heir.relationship}${lineage}`
  }
  return t("releases.unknownHeir")
}

/** The frozen Fara'id/Wasiyyah snapshot — the legal record for share disputes. */
export function EstateDialog({ ownerId, onClose }: { ownerId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const detail = useQuery(api.admin.estates.getEstateDetail, { ownerId })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("releases.estateTitle")}</DialogTitle>
          <DialogDescription>
            {detail === undefined ? (
              t("common.loading")
            ) : detail === null ? (
              t("common.notFound")
            ) : (
              <>
                {detail.ownerEmail ?? t("releases.unknownOwner")} · {t("releases.estateMeta")}{" "}
                <TimeCell ts={detail.releasedAt} />
                {detail.deathCase !== null &&
                  (detail.deathCase.reviewedBy !== null
                    ? ` · ${t("releases.approvedByAdmin")}`
                    : ` · ${t("releases.longstopRelease")}`)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {detail === undefined ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : detail === null ? null : (
          <>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground h-9 text-xs font-semibold uppercase tracking-wider">{t("releases.colHeir")}</TableHead>
                    <TableHead className="text-muted-foreground h-9 text-xs font-semibold uppercase tracking-wider">{t("releases.colKind")}</TableHead>
                    <TableHead className="text-muted-foreground h-9 text-end text-xs font-semibold uppercase tracking-wider">{t("releases.colShare")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.shares.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground h-16 text-center text-sm">
                        {t("releases.noShares")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.shares.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm capitalize">
                          {heirLabel(s.heir, t)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              s.kind === "faraid"
                                ? "border-transparent bg-green-600/10 text-green-700 dark:text-green-400"
                                : "bg-primary/10 text-primary border-transparent"
                            }
                          >
                            {s.kind === "faraid" ? t("releases.faraid") : t("releases.wasiyyah")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="font-mono text-sm">
                            {s.fractionNumerator}/{s.fractionDenominator}
                          </span>
                          <span className="text-muted-foreground ms-2 text-xs tabular-nums">
                            {s.percent.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Lock className="size-3" /> {t("releases.zkNote")}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
