"use client"

import { type ItemField } from "@workspace/landing-content"
import { Plus, X } from "lucide-react"
import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { IconSelect } from "./icon-select"
import { StringArrayEditor } from "./string-array-editor"
import { TextField } from "./text-field"

type Item = Record<string, unknown>

type Props = {
  sectionId: string
  items: Item[]
  itemFields: ItemField[]
  fixedLength?: number
  min?: number
  max?: number
  onChange: (next: Item[]) => void
}

/** Item-field label: section-specific key wins, generic key falls back, then
 *  the raw key (e.g. landing.fields.testi.n → landing.fields.n → "n"). */
function labelFor(t: TFunction, sectionId: string, key: string): string {
  return t(`landing.fields.${sectionId}.${key}`, {
    defaultValue: t(`landing.fields.${key}`, { defaultValue: key }),
  })
}

function emptyItem(itemFields: ItemField[]): Item {
  const item: Item = {}
  for (const f of itemFields) {
    item[f.key] = f.kind === "string-array" ? [""] : ""
  }
  return item
}

/** List of structured items (steps, tiers, FAQs…) as divided rows in one
 *  bordered container. Spread-edits preserve keys outside the manifest
 *  (tier `id`/`hl`); add/remove hides for fixed lengths. */
export function ObjectArrayEditor({
  sectionId,
  items,
  itemFields,
  fixedLength,
  min,
  max,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const canAdd = fixedLength === undefined && (max === undefined || items.length < max)
  const canRemove =
    fixedLength === undefined && (min === undefined || items.length > min)

  function setItem(i: number, key: string, value: unknown) {
    onChange(items.map((item, j) => (j === i ? { ...item, [key]: value } : item)))
  }

  return (
    <div className="divide-border/60 divide-y rounded-xl border">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("landing.item", { n: i + 1 })}
            </span>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive -my-1 size-7"
                aria-label={t("landing.removeItem")}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {itemFields.map((f) => {
              const label = labelFor(t, sectionId, f.key)
              if (f.kind === "icon") {
                return (
                  <IconSelect
                    key={f.key}
                    label={label}
                    value={typeof item[f.key] === "string" ? (item[f.key] as string) : ""}
                    onChange={(next) => setItem(i, f.key, next)}
                  />
                )
              }
              if (f.kind === "string-array") {
                return (
                  <div key={f.key} className="sm:col-span-2">
                    <StringArrayEditor
                      label={label}
                      value={Array.isArray(item[f.key]) ? (item[f.key] as string[]) : []}
                      min={f.min}
                      max={f.max}
                      onChange={(next) => setItem(i, f.key, next)}
                    />
                  </div>
                )
              }
              return (
                <div
                  key={f.key}
                  className={f.kind === "textarea" ? "sm:col-span-2" : undefined}
                >
                  <TextField
                    label={label}
                    kind={f.kind}
                    value={typeof item[f.key] === "string" ? (item[f.key] as string) : ""}
                    onChange={(next) => setItem(i, f.key, next)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {canAdd && (
        <div className="p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, emptyItem(itemFields)])}
          >
            <Plus /> {t("landing.addItem")}
          </Button>
        </div>
      )}
    </div>
  )
}
