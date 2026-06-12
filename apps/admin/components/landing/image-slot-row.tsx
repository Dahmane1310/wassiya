"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { type ImageSlotId } from "@workspace/landing-content"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const THUMB_HEIGHT = 88

type Props = {
  slot: ImageSlotId
  aspect: string
}

/** Inline image field for a section: aspect-true thumbnail (click or drop to
 *  upload), usage hint, remove/upload actions. Uploads land in the image
 *  DRAFT immediately (separate from the copy draft) and go live on Publish.
 *  Self-subscribes to getLandingContent — Convex dedupes the query. */
export function ImageSlotRow({ slot, aspect }: Props) {
  const { t } = useTranslation()
  const content = useQuery(api.admin.landing.getLandingContent)
  const generateUploadUrl = useMutation(api.admin.landing.generateImageUploadUrl)
  const setImage = useMutation(api.admin.landing.setLandingImage)
  const removeImage = useMutation(api.admin.landing.removeLandingImage)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const draftUrl = content?.images.draft[slot] ?? null
  const publishedUrl = content?.images.published[slot] ?? null
  const shown = draftUrl ?? publishedUrl
  const unpublished = content !== undefined && draftUrl !== publishedUrl

  async function upload(file: File) {
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      toast.error(t("landing.imageInvalid"))
      return
    }
    setBusy(true)
    try {
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!res.ok) throw new Error("upload failed")
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
      await setImage({ slot, storageId })
      toast.success(t("landing.imageUpdated"))
    } catch {
      toast.error(t("landing.imageFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border p-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file !== undefined) void upload(file)
        }}
      />

      {/* Thumbnail at the slot's true aspect — also the click/drop target. */}
      <button
        type="button"
        disabled={busy}
        aria-label={t("landing.upload")}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const file = e.dataTransfer.files[0]
          if (file !== undefined) void upload(file)
        }}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-lg border transition-colors",
          shown === null && "border-dashed",
          over ? "border-primary bg-primary/5" : "bg-muted/40 hover:border-primary/50",
        )}
        style={{ height: THUMB_HEIGHT, aspectRatio: aspect }}
      >
        {shown !== null ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
            <img src={shown} alt="" className="size-full object-cover" />
            <span className="bg-background/80 absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <Upload className="size-4" />
            </span>
          </>
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            <ImagePlus className="size-5" />
          </span>
        )}
        {busy && (
          <span className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <Spinner className="size-4" />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t(`landing.slots.${slot}`)}</span>
          {unpublished && (
            <Badge
              variant="secondary"
              className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
            >
              {t("landing.unpublished")}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1 max-w-xl text-[13px]">
          {t(`landing.slotHints.${slot}`)}
        </p>
        {(shown === null || (unpublished && publishedUrl !== null)) && (
          <p className="text-muted-foreground mt-1 text-xs">
            {shown === null ? t("landing.slotEmpty") : t("landing.liveDiffers")}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {draftUrl !== null && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            disabled={busy}
            onClick={async () => {
              try {
                await removeImage({ slot })
                toast.success(t("landing.imageRemoved"))
              } catch {
                toast.error(t("landing.imageFailed"))
              }
            }}
          >
            <Trash2 /> {t("landing.removeImage")}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload /> {t("landing.upload")}
        </Button>
      </div>
    </div>
  )
}
