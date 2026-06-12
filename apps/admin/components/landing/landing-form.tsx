"use client"

import { useMutation } from "convex/react"
import { type Dict, type Lang, type SectionSpec } from "@workspace/landing-content"
import { RotateCcw, Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SectionEditor } from "./section-editor"
import { SectionRail } from "./section-rail"
import { useLandingForm } from "./use-landing-form"

type Props = {
  lang: Lang
  /** The manifest sections THIS page edits (saves still write the whole dict). */
  sections: SectionSpec[]
  activeSection: string
  onSelectSection: (id: string) => void
  initial: Dict
  /** A draft row exists server-side (discard stays reachable when clean). */
  hasDraft: boolean
  /** What a discard resets to (published content or the built-in copy). */
  publishedOrDefault: Dict
}

/** One language's editor: section rail + the active section's pane, with a
 *  floating save bar that appears once there are local edits. */
export function LandingForm({
  lang,
  sections,
  activeSection,
  onSelectSection,
  initial,
  hasDraft,
  publishedOrDefault,
}: Props) {
  const { t } = useTranslation()
  const form = useLandingForm(initial)
  const saveDraft = useMutation(api.admin.landing.saveDraft)
  const discardDraft = useMutation(api.admin.landing.discardDraft)
  const section = sections.find((s) => s.id === activeSection) ?? sections[0]!

  async function save() {
    try {
      await saveDraft({ lang, data: form.value })
      form.markSaved()
      toast.success(t("landing.saved"))
    } catch {
      toast.error(t("landing.saveFailed"))
    }
  }

  const discardDialog = (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm">
          <RotateCcw /> {t("landing.discard")}
        </Button>
      }
      title={t("landing.discardTitle")}
      description={t("landing.discardBody")}
      confirmLabel={t("landing.discard")}
      destructive
      onConfirm={async () => {
        try {
          await discardDraft({ lang })
          form.reset(publishedOrDefault)
          toast.success(t("landing.discarded"))
        } catch {
          toast.error(t("landing.discardFailed"))
        }
      }}
    />
  )

  return (
    <div
      className="grid items-start gap-4 md:grid-cols-[210px_1fr]"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <SectionRail
        sections={sections}
        active={section.id}
        form={form}
        onSelect={onSelectSection}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="gap-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">
              {t(`landing.sections.${section.id}`)}
            </CardTitle>
            {/* A saved (clean) draft can still be reverted from here. */}
            {hasDraft && !form.dirty && discardDialog}
          </CardHeader>
          <CardContent>
            <SectionEditor section={section} form={form} />
          </CardContent>
        </Card>

        {form.dirty && (
          <div className="bg-background/95 sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border p-3 shadow-lg backdrop-blur">
            <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
              {t("landing.unsaved")}
            </Badge>
            <div className="flex items-center gap-2">
              {discardDialog}
              <Button size="sm" onClick={() => void save()}>
                <Save /> {t("landing.save")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
