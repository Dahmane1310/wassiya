"use client"

import { type SectionSpec } from "@workspace/landing-content"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { type LandingForm } from "./use-landing-form"

type Props = {
  sections: SectionSpec[]
  active: string
  form: LandingForm
  onSelect: (id: string) => void
}

/** Slim section navigator beside the editor pane. The amber dot marks
 *  sections with local (unsaved) edits. */
export function SectionRail({ sections, active, form, onSelect }: Props) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-col gap-0.5 md:sticky md:top-4 md:self-start">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
            section.id === active
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <span className="truncate">{t(`landing.sections.${section.id}`)}</span>
          {form.sectionDirty(section) && (
            <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
          )}
        </button>
      ))}
    </nav>
  )
}
