"use client"

import { IMAGE_SLOTS, type SectionSpec } from "@workspace/landing-content"
import { type TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { ImageSlotRow } from "./image-slot-row"
import { ObjectArrayEditor } from "./object-array-editor"
import { TextField } from "./text-field"
import { type LandingForm } from "./use-landing-form"

/** Top-level field label from the path tail, with section-specific override
 *  (landing.fields.<section>.<tail> → landing.fields.<tail> → tail). */
function labelFor(t: TFunction, sectionId: string, path: string): string {
  const tail = path.split(".").pop() ?? path
  return t(`landing.fields.${sectionId}.${tail}`, {
    defaultValue: t(`landing.fields.${tail}`, { defaultValue: tail }),
  })
}

/** Renders one manifest section's fields: short texts two-up, textareas and
 *  item lists full width. */
export function SectionEditor({
  section,
  form,
}: {
  section: SectionSpec
  form: LandingForm
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Image slots hosted by this section (logo → nav, hero photo → hero, …).
          Uploads are drafted immediately — independent of the copy form. */}
      {IMAGE_SLOTS.filter((s) => s.sectionId === section.id).map((s) => (
        <div key={s.id} className="sm:col-span-2">
          <ImageSlotRow slot={s.id} aspect={s.aspect} />
        </div>
      ))}
      {section.fields.map((field) => {
        if (field.kind === "object-array") {
          const items = form.getAt(field.path)
          return (
            <div key={field.path} className="sm:col-span-2">
              <ObjectArrayEditor
                sectionId={section.id}
                items={Array.isArray(items) ? (items as Record<string, unknown>[]) : []}
                itemFields={field.itemFields}
                fixedLength={field.fixedLength}
                min={field.min}
                max={field.max}
                onChange={(next) => form.setAt(field.path, next)}
              />
            </div>
          )
        }
        const value = form.getAt(field.path)
        return (
          <div
            key={field.path}
            className={field.kind === "textarea" ? "sm:col-span-2" : undefined}
          >
            <TextField
              label={labelFor(t, section.id, field.path)}
              kind={field.kind}
              value={typeof value === "string" ? value : ""}
              onChange={(next) => form.setAt(field.path, next)}
            />
          </div>
        )
      })}
    </div>
  )
}
