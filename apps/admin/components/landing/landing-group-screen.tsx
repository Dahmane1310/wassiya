"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { DEFAULT_DICTS, LANDING_MANIFEST, type Lang } from "@workspace/landing-content"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { LandingForm } from "./landing-form"
import { LANDING_GROUPS, type LandingGroupId } from "./landing-groups"
import { LandingHeader } from "./landing-header"

const LANGS: Lang[] = ["en", "ar"]

/** One Content page: the sections of one landing group, per language. Both
 *  language forms stay mounted (CSS hidden) so unsaved edits survive the
 *  switch; the selected section survives it too. */
export function LandingGroupScreen({ groupId }: { groupId: LandingGroupId }) {
  const { t } = useTranslation()
  const content = useQuery(api.admin.landing.getLandingContent)
  const sectionIds: readonly string[] = LANDING_GROUPS[groupId]
  const sections = LANDING_MANIFEST.filter((s) => sectionIds.includes(s.id))
  const [lang, setLang] = useState<Lang>("en")
  const [activeSection, setActiveSection] = useState<string>(sections[0]!.id)

  if (content === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-[210px_1fr]">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <LandingHeader
        title={t(`landing.groups.${groupId}`)}
        subtitle={t("landing.groupSubtitle")}
        content={content}
        extra={
          <>
            {content[lang].hasUnpublishedChanges && (
              <Badge
                variant="secondary"
                className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
              >
                {t("landing.unpublished")}
              </Badge>
            )}
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger size="sm" className="w-32" aria-label={t("landing.language")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("landing.tabEn")}</SelectItem>
                <SelectItem value="ar">{t("landing.tabAr")}</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {LANGS.map((l) => (
        <div key={l} className={l === lang ? undefined : "hidden"}>
          <LandingForm
            lang={l}
            sections={sections}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            initial={content[l].draft ?? content[l].published ?? DEFAULT_DICTS[l]}
            hasDraft={content[l].draft !== null}
            publishedOrDefault={content[l].published ?? DEFAULT_DICTS[l]}
          />
        </div>
      ))}
    </div>
  )
}
