import AsyncStorage from "@react-native-async-storage/async-storage"
import { Uniwind } from "uniwind"
import { create } from "zustand"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "app.theme"

/**
 * The chosen theme MODE (light / dark / system), reactive so the Settings picker
 * can show the live selection — including "system", which `useColorScheme` alone
 * can't distinguish from an explicit light/dark. `setThemeMode` is the single
 * writer, so every entry point (toggles + picker) keeps this in sync.
 */
export const useThemeMode = create<{ mode: ThemeMode }>(() => ({
  mode: "system",
}))

/**
 * Apply the saved theme on startup. Leaves Uniwind adaptive for "system" (follows
 * the OS), but still records the mode so the picker reflects it. Unlike the OS
 * color scheme, this override is not persisted natively — re-applied every launch.
 */
export async function initTheme(): Promise<void> {
  try {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null
    if (stored === "light" || stored === "dark" || stored === "system") {
      if (stored !== "system") Uniwind.setTheme(stored)
      useThemeMode.setState({ mode: stored })
    }
  } catch {
    // Default (system / adaptive) stands.
  }
}

/**
 * Set + persist the theme. Switching is instant — Uniwind re-resolves tokens and
 * also syncs RN Appearance (so useColorScheme consumers like VaultGlow and the
 * StatusBar follow). No app reload needed.
 */
export async function setThemeMode(mode: ThemeMode): Promise<void> {
  Uniwind.setTheme(mode)
  useThemeMode.setState({ mode })
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Non-fatal: the in-memory theme change still applies for this session.
  }
}
