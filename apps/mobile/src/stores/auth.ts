import * as SecureStore from "expo-secure-store"
import { create } from "zustand"
import {
  refreshWorkOSTokens,
  signInWithWorkOS,
  type WorkOSTokens,
} from "@/src/lib/auth"

const ACCESS_KEY = "workos.accessToken"
const REFRESH_KEY = "workos.refreshToken"
// Refresh slightly before expiry to avoid races on the boundary.
const EXPIRY_SKEW_MS = 30_000

type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  // Tokens live in state (in-memory) and are persisted MANUALLY to SecureStore
  // under separate keys. Tokens are sensitive: never AsyncStorage, never the
  // Zustand persist middleware (a single JSON blob can exceed iOS's ~2KB/key).
  accessToken: string | null
  refreshToken: string | null

  hydrate: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  // Bridge for Convex's ConvexProviderWithAuth.
  fetchAccessToken: (opts?: { forceRefreshToken?: boolean }) => Promise<string | null>
}

async function persistTokens(tokens: WorkOSTokens | null) {
  if (tokens) {
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken)
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken)
  } else {
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,

  // Load persisted tokens on launch. Call once (see app/_layout.tsx).
  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_KEY)
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, isAuthenticated: true })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async () => {
    const tokens = await signInWithWorkOS()
    await persistTokens(tokens)
    set({ ...tokens, isAuthenticated: true })
  },

  signOut: async () => {
    await persistTokens(null)
    set({ accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  fetchAccessToken: async ({ forceRefreshToken } = {}) => {
    const { accessToken, refreshToken } = get()
    if (!accessToken || !refreshToken) return null

    if (forceRefreshToken || isExpired(accessToken)) {
      try {
        const refreshed = await refreshWorkOSTokens(refreshToken)
        await persistTokens(refreshed)
        set({ ...refreshed })
        return refreshed.accessToken
      } catch {
        // Refresh token invalid/expired — drop the session.
        await persistTokens(null)
        set({ accessToken: null, refreshToken: null, isAuthenticated: false })
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
