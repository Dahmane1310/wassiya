import { WorkOS } from "@workos-inc/node"
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"

const clientId = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID!
const redirectUri = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI!

// Public client: PKCE flow, no API key/secret in the app bundle.
const workos = new WorkOS(undefined, { clientId })

export type WorkOSTokens = { accessToken: string; refreshToken: string }

export type OAuthProvider = "GoogleOAuth" | "AppleOAuth" | "authkit"

// Runs the full PKCE sign-in: build the authorization URL (+ code verifier),
// open the provider's consent page in the browser, capture the `code` from the
// deep-link callback, then exchange code + verifier for tokens. No API key
// required. "GoogleOAuth"/"AppleOAuth" go PROVIDER-DIRECT (no WorkOS
// interstitial); email/password and email-code auth use native screens via the
// Convex proxy instead (lib/auth-proxy.ts).
export async function signInWithWorkOS(
  provider: OAuthProvider = "authkit"
): Promise<WorkOSTokens> {
  const { url, codeVerifier } =
    await workos.userManagement.getAuthorizationUrlWithPKCE({
      provider,
      clientId,
      redirectUri,
    })

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri)
  if (result.type !== "success") {
    throw new Error(`Sign-in not completed (${result.type})`)
  }

  const code = Linking.parse(result.url).queryParams?.code
  if (typeof code !== "string") {
    throw new Error("No authorization code in callback")
  }

  const auth = await workos.userManagement.authenticateWithCode({
    code,
    codeVerifier,
    clientId,
  })
  return { accessToken: auth.accessToken, refreshToken: auth.refreshToken }
}

// Exchanges a stored refresh token for a fresh access token (used by the Convex
// fetchAccessToken bridge on expiry / forced refresh).
export async function refreshWorkOSTokens(
  refreshToken: string
): Promise<WorkOSTokens> {
  const auth = await workos.userManagement.authenticateWithRefreshToken({
    refreshToken,
    clientId,
  })
  return { accessToken: auth.accessToken, refreshToken: auth.refreshToken }
}
