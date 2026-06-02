import AsyncStorage from "@react-native-async-storage/async-storage"
import { reloadAppAsync } from "expo"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { I18nManager } from "react-native"
import ar from "@/locales/ar.json"
import en from "@/locales/en.json"

export type AppLanguage = "en" | "ar"

const STORAGE_KEY = "app.language"
const RTL_LANGUAGES: readonly AppLanguage[] = ["ar"]

export function isRtlLanguage(language: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(language)
}

// Permit RTL at the native level once, up front. Actually flipping direction
// happens only in setAppLanguage (and requires an app reload to take effect).
I18nManager.allowRTL(true)

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: "en",
  fallbackLng: "en",
  // RN has no XSS surface, and we never inject HTML.
  interpolation: { escapeValue: false },
  returnNull: false,
})

/**
 * Restore the saved language on startup. NEVER reloads the app — reconciling a
 * native-RTL vs stored-language mismatch here could create a boot loop. Direction
 * flips happen only in setAppLanguage.
 */
export async function initLanguage(): Promise<void> {
  try {
    const stored = (await AsyncStorage.getItem(
      STORAGE_KEY
    )) as AppLanguage | null
    if (stored && stored !== i18n.language) {
      await i18n.changeLanguage(stored)
    }
  } catch {
    // Fall back to the default ("en"); not worth failing startup over.
  }
}

/**
 * Switch the app language. Persists the choice, and reloads the app ONLY when the
 * layout direction actually flips (LTR <-> RTL) — React Native can't re-mirror an
 * already-rendered tree without a reload.
 */
export async function setAppLanguage(language: AppLanguage): Promise<void> {
  if (language === i18n.language) return

  await i18n.changeLanguage(language)
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Non-fatal: the in-memory language change still applies for this session.
  }

  const shouldBeRtl = isRtlLanguage(language)
  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.forceRTL(shouldBeRtl)
    await reloadAppAsync()
  }
}

export default i18n
