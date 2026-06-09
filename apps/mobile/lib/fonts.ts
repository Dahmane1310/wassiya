import { I18nManager } from "react-native"

/**
 * Font-family class for EDITABLE text — `<TextInput>` value + placeholder. The
 * shared `Text` component already remaps Latin families to Tajawal under RTL, but
 * raw TextInputs don't go through it, so apply this to keep typed Arabic in Tajawal
 * (Inter has no Arabic glyphs). RTL is fixed per session, so a module constant is
 * enough — no re-render needed.
 */
export const inputFontClass = I18nManager.isRTL ? "font-body-ar" : "font-sans"
