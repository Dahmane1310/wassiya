"use client"

import { useQuery } from "convex/react"
import { ExternalLink, FileX2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

type Props = {
  caseId: Id<"deathVerification">
  hasCertificate: boolean
}

/** Inline certificate preview — the document and the decision belong on the
 *  same screen. Convex serves the stored content-type, so images and PDFs
 *  render directly in the iframe. */
export function CertViewer({ caseId, hasCertificate }: Props) {
  const { t } = useTranslation()
  const url = useQuery(api.release.getCertUrl, hasCertificate ? { id: caseId } : "skip")

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          {t("review.certificate")}
        </span>
        {hasCertificate && typeof url === "string" && (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground h-7">
            <a href={url} target="_blank" rel="noreferrer">
              {t("review.openCertificate")} <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </div>
      {!hasCertificate ? (
        <div className="bg-muted/30 text-muted-foreground flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
          <FileX2 className="size-6" />
          <span className="text-sm">{t("review.certNoneAttached")}</span>
        </div>
      ) : url === undefined ? (
        <Skeleton className="h-[520px] w-full rounded-xl" />
      ) : url === null ? (
        <div className="bg-muted/30 text-muted-foreground flex h-72 items-center justify-center rounded-xl border border-dashed text-sm">
          {t("review.certUnavailable")}
        </div>
      ) : (
        <>
          {/* Fragment params strip the browser PDF chrome (toolbar, thumbnail
              rail) and fit the page to width — a minimal document view. The
              fragment never reaches the server, so the signed URL stays valid.
              Full controls live behind "Open certificate". */}
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title={t("review.certificate")}
            className="h-[440px] w-full rounded-xl border bg-white lg:h-[560px]"
          />
          <p className="text-muted-foreground text-xs">
            {t("review.certPreviewFallback")}
          </p>
        </>
      )}
    </div>
  )
}
