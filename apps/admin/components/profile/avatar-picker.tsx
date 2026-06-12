"use client"

import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { type Area } from "react-easy-crop"
import { Camera, Trash2, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { type Id } from "@workspace/backend/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cropImageToBlob } from "@/lib/crop-image"
import { AvatarCropDialog } from "./avatar-crop-dialog"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

type Props = {
  avatarUrl: string | null
  hasCustomAvatar: boolean
  initials: string
}

/** The identity avatar with a camera badge. Picking a photo opens a crop/zoom
 *  step; only the cropped square is uploaded (Convex storage). */
export function AvatarPicker({ avatarUrl, hasCustomAvatar, initials }: Props) {
  const { t } = useTranslation()
  const generateUploadUrl = useMutation(api.admin.profile.generateAvatarUploadUrl)
  const setAvatar = useMutation(api.admin.profile.setMyAvatar)
  const removeAvatar = useMutation(api.admin.profile.removeMyAvatar)
  const fileRef = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState<string | null>(null) // object URL being cropped
  const [busy, setBusy] = useState(false)

  function closeCrop() {
    if (src !== null) URL.revokeObjectURL(src)
    setSrc(null)
  }

  async function saveCrop(area: Area) {
    if (src === null) return
    setBusy(true)
    try {
      const blob = await cropImageToBlob(src, area)
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      })
      if (!res.ok) throw new Error("upload failed")
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
      await setAvatar({ storageId })
      toast.success(t("profile.avatarUpdated"))
      closeCrop()
    } catch {
      toast.error(t("profile.avatarFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = "" // same file re-selectable
          if (file === undefined) return
          if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
            toast.error(t("profile.avatarInvalid"))
            return
          }
          setSrc(URL.createObjectURL(file))
        }}
      />
      {avatarUrl !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimizable
        <img src={avatarUrl} alt="" className="size-14 rounded-2xl object-cover" />
      ) : (
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl text-xl font-semibold tracking-tight">
          {initials}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            aria-label={t("profile.avatarChange")}
            className="bg-background text-muted-foreground hover:text-foreground absolute -end-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-50"
          >
            <Camera className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload />
            {t("profile.avatarUpload")}
          </DropdownMenuItem>
          {hasCustomAvatar && (
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                try {
                  await removeAvatar()
                  toast.success(t("profile.avatarRemoved"))
                } catch {
                  toast.error(t("profile.avatarFailed"))
                }
              }}
            >
              <Trash2 />
              {t("profile.avatarRemove")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {src !== null && (
        <AvatarCropDialog
          key={src}
          src={src}
          busy={busy}
          onClose={closeCrop}
          onSave={(area) => void saveCrop(area)}
        />
      )}
    </div>
  )
}
