"use client"

import { Check, Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useLang } from "./lang-provider"

/** Header language switcher — flips the document language and layout
 *  direction (Arabic = RTL). */
export function LangToggle() {
  const { t } = useTranslation()
  const { lang, setLang } = useLang()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={t("common.changeLanguage")}
        >
          <Languages className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setLang("en")}>
          English
          {lang === "en" && <Check className="ms-auto size-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang("ar")}>
          العربية
          {lang === "ar" && <Check className="ms-auto size-3.5" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
