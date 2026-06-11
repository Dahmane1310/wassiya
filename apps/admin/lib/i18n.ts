import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ar from "@/locales/ar.json"
import en from "@/locales/en.json"

// Panel i18n (same stack as apps/mobile). Initialized on first import — the
// LangProvider switches the language alongside <html lang dir>.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }, // React already escapes
  })
}

export default i18n
