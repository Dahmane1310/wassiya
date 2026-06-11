"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import i18n from "@/lib/i18n"

export type Lang = "en" | "ar"

const STORAGE_KEY = "wassiya_admin_lang"

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
})

function apply(lang: Lang) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  void i18n.changeLanguage(lang)
}

/** Holds the panel language and mirrors it onto <html lang dir>. The boot
 *  script in app/layout.tsx applies the stored dir before first paint; this
 *  provider re-syncs React state after hydration. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "ar" || stored === "en") {
      setLangState(stored)
      apply(stored)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    apply(l)
  }, [])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
