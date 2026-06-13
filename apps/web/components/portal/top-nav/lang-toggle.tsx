"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { useLang } from "@/components/lang-provider"

/** EN/ع switch — shows the language you'd switch TO (same as the landing). */
export function LangToggle() {
  const { t } = useTranslation()
  const { lang, setLang } = useLang()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-9 rounded-full text-[13px] font-bold"
      aria-label={t("nav.language")}
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
    >
      {lang === "ar" ? "EN" : "ع"}
    </Button>
  )
}
