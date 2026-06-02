import { useTranslation } from "react-i18next"

type BrandType = {
  /** True when the active language is Arabic (RTL). */
  ar: boolean
  /** Display family for hero headlines (Fraunces / Tajawal). */
  display: string
  /** Heavy display family for the wordmark. */
  displayBold: string
  /** Body / UI family (Inter / Tajawal). Apply to ALL text — Latin fonts render
   *  Arabic as tofu on Android, so Arabic must be routed through Tajawal. */
  body: string
  /** Letter-spacing class. Empty for Arabic — tracking breaks cursive joins. */
  tracking: string
}

/**
 * Resolves the right type families for the active language. Fraunces + Inter for
 * English; Tajawal for Arabic (Fraunces/Inter have no Arabic glyphs).
 */
export function useBrandType(): BrandType {
  const { i18n } = useTranslation()
  const ar = i18n.language === "ar"
  return {
    ar,
    display: ar ? "font-display-ar" : "font-display",
    displayBold: ar ? "font-display-ar-bold" : "font-display-bold",
    body: ar ? "font-body-ar" : "font-sans",
    tracking: ar ? "" : "tracking-tight",
  }
}
