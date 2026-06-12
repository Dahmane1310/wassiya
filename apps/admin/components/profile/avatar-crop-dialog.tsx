"use client"

import { useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Slider } from "@workspace/ui/components/slider"

type Props = {
  src: string // object URL of the picked file
  busy: boolean
  onClose: () => void
  onSave: (area: Area) => void
}

/** Crop + zoom step before the avatar upload. Mount with `key={src}` so the
 *  crop state resets per picked image. */
export function AvatarCropDialog({ src, busy, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profile.avatarCropTitle")}</DialogTitle>
          <DialogDescription>{t("profile.avatarCropBody")}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted relative h-72 w-full overflow-hidden rounded-lg">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setArea(areaPixels)}
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="text-muted-foreground size-4 shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            aria-label={t("profile.avatarCropZoom")}
          />
          <ZoomIn className="text-muted-foreground size-4 shrink-0" />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy || area === null}
            onClick={() => {
              if (area !== null) onSave(area)
            }}
          >
            {t("profile.avatarCropSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
