import AsyncStorage from "@react-native-async-storage/async-storage"
import { Uniwind } from "uniwind"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "app.theme"

/**
 * Apply the saved theme on startup. No-op for "system" (Uniwind stays adaptive,
 * following the OS). Unlike the OS color scheme, this override is not persisted
 * natively, so it must be re-applied every launch.
 */
export async function initTheme(): Promise<void> {
  try {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null
    if (stored === "light" || stored === "dark") {
      Uniwind.setTheme(stored)
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
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Non-fatal: the in-memory theme change still applies for this session.
  }
}
