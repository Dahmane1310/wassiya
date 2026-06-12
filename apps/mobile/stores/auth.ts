import * as SecureStore from "expo-secure-store"
import { create } from "zustand"
import {
  refreshWorkOSTokens,
  signInWithWorkOS,
  type OAuthProvider,
  type WorkOSTokens,
} from "@/lib/auth"
import { proxyRefresh } from "@/lib/auth-proxy"
import { useVaultStore } from "@/stores/vault"

const ACCESS_KEY = "workos.accessToken"
const REFRESH_KEY = "workos.refreshToken"
const MODE_KEY = "workos.authMode"
// Refresh slightly before expiry to avoid races on the boundary.
const EXPIRY_SKEW_MS = 30_000

// How this session was minted decides how it REFRESHES: PKCE (browser OAuth)
// sessions refresh as a public client; proxy (native email/password/code via
// the Convex backend) sessions were minted confidentially and refresh through
// the same proxy.
export type AuthMode = "pkce" | "proxy"

type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  // Tokens live in state (in-memory) and are persisted MANUALLY to SecureStore
  // under separate keys. Tokens are sensitive: never AsyncStorage, never the
  // Zustand persist middleware (a single JSON blob can exceed iOS's ~2KB/key).
  accessToken: string | null
  refreshToken: string | null
  authMode: AuthMode

  hydrate: () => Promise<void>
  signIn: (provider?: OAuthProvider) => Promise<void>
  // Entry point for the native auth screens (tokens minted by the proxy).
  signInWithTokens: (tokens: WorkOSTokens) => Promise<void>
  signOut: () => Promise<void>
  // Bridge for Convex's ConvexProviderWithAuth.
  fetchAccessToken: (opts?: {
    forceRefreshToken?: boolean
  }) => Promise<string | null>
}

async function persistTokens(tokens: WorkOSTokens | null, mode?: AuthMode) {
  if (tokens) {
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken)
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken)
    if (mode) await SecureStore.setItemAsync(MODE_KEY, mode)
  } else {
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
    await SecureStore.deleteItemAsync(MODE_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  authMode: "pkce",

  // Load persisted tokens on launch. Call once (see app/_layout.tsx).
  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_KEY)
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
      const mode = await SecureStore.getItemAsync(MODE_KEY)
      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          authMode: mode === "proxy" ? "proxy" : "pkce",
          isAuthenticated: true,
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (provider) => {
    const tokens = await signInWithWorkOS(provider)
    await persistTokens(tokens, "pkce")
    set({ ...tokens, authMode: "pkce", isAuthenticated: true })
  },

  signInWithTokens: async (tokens) => {
    await persistTokens(tokens, "proxy")
    set({ ...tokens, authMode: "proxy", isAuthenticated: true })
  },

  signOut: async () => {
    await persistTokens(null)
    set({ accessToken: null, refreshToken: null, isAuthenticated: false })
    // Only drop the in-memory master key. The device PIN wrap + biometric key are
    // NAMESPACED BY ACCOUNT (lib/pin-store, lib/biometric), so a different user
    // signing in here can't reach this account's secrets, while this account keeps
    // its PIN/biometric across an ordinary sign-out → sign-in (no recovery-key cliff).
    useVaultStore.getState().lock()
  },

  fetchAccessToken: async ({ forceRefreshToken } = {}) => {
    const { accessToken, refreshToken, authMode } = get()
    if (!accessToken || !refreshToken) return null

    if (forceRefreshToken || isExpired(accessToken)) {
      try {
        const refreshed =
          authMode === "proxy"
            ? await proxyRefresh(refreshToken)
            : await refreshWorkOSTokens(refreshToken)
        await persistTokens(refreshed, authMode)
        set({ ...refreshed })
        return refreshed.accessToken
      } catch {
        // Refresh token invalid/expired — drop the session and lock the vault.
        await persistTokens(null)
        set({ accessToken: null, refreshToken: null, isAuthenticated: false })
        useVaultStore.getState().lock()
        return null
      }
    }
    return accessToken
  },
}))

// Shape ConvexProviderWithAuth expects. Selecting the action gives a stable
// reference; isLoading/isAuthenticated drive re-subscription as they change.
export function useAuthFromWorkOS() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fetchAccessToken = useAuthStore((s) => s.fetchAccessToken)
  return { isLoading, isAuthenticated, fetchAccessToken }
}

// Decodes a JWT's `exp` and returns true if it is past (minus skew). On any
// parse failure, treat as expired so we refresh rather than send a bad token.
function isExpired(jwt: string): boolean {
  try {
    const payload = jwt.split(".")[1]
    if (!payload) return true
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const exp = JSON.parse(json).exp as number | undefined
    if (typeof exp !== "number") return false
    return Date.now() >= exp * 1000 - EXPIRY_SKEW_MS
  } catch {
    return true
  }
}

// The JWT `sub` claim — a stable per-user id used to NAMESPACE this account's
// device-local vault secrets (PIN wrap + biometric key). It need not equal the
// server's `tokenIdentifier`; it only has to be stable and unique per account.
function decodeSub(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const sub = JSON.parse(json).sub as string | undefined
    return typeof sub === "string" && sub.length > 0 ? sub : null
  } catch {
    return null
  }
}

/** The signed-in account id (JWT sub), or null. Imperative read for hooks/lib. */
export function currentAccountId(): string | null {
  const token = useAuthStore.getState().accessToken
  return token ? decodeSub(token) : null
}

/** Reactive account id for components (re-renders if the token changes). */
export function useAccountId(): string | null {
  return useAuthStore((s) => (s.accessToken ? decodeSub(s.accessToken) : null))
}
