"use client"

import { type ReactNode, useCallback, useState } from "react"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from "@workos-inc/authkit-nextjs/components"

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  )

  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  )
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth()
  const { getAccessToken, refresh } = useAccessToken()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
      if (!user) return null
      try {
        return (forceRefreshToken ? await refresh() : await getAccessToken()) ?? null
      } catch (error) {
        console.error("Failed to fetch Convex access token", error)
        return null
      }
    },
    [user, refresh, getAccessToken],
  )

  return { isLoading, isAuthenticated: !!user, fetchAccessToken }
}
