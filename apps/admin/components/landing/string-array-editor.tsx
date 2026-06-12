"use client"

import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

type Props = {
  label: string
  value: string[]
  min?: number
  max?: number
  onChange: (next: string[]) => void
}

/** Editable list of plain strings (tier features, footer links). */
export function StringArrayEditor({ label, value, min, max, onChange }: Props) {
  const { t } = useTranslation()
  const canAdd = max === undefined || value.length < max
  const canRemove = min === undefined || value.length > min

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex flex-col gap-2">
        {value.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={entry}
              onChange={(e) =>
                onChange(value.map((s, j) => (j === i ? e.target.value : s)))
              }
            />
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-8 shrink-0"
                aria-label={t("landing.removeItem")}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onChange([...value, ""])}
          >
            <Plus /> {t("landing.addItem")}
          </Button>
        )}
      </div>
    </div>
  )
}
