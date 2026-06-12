import { NextResponse, type NextRequest } from "next/server"
import { getWorkOS } from "@workos-inc/authkit-nextjs"
import { sealData } from "iron-session"

// Provider-direct OAuth start (Google/Apple buttons on OUR pages — no hosted
// WorkOS interstitial). Mirrors authkit-nextjs's internal flow exactly: a
// sealed PKCE state ({nonce, codeVerifier, returnPathname}) goes both into the
// `state` param and the `wos-auth-verifier` cookie (the legacy shared name the
// callback explicitly accepts), so the stock handleAuth() callback verifies
// CSRF, exchanges the code, and saves the session unchanged.

const PROVIDERS: Record<string, string> = {
  google: "GoogleOAuth",
  apple: "AppleOAuth",
}

export async function GET(request: NextRequest) {
  const provider = PROVIDERS[request.nextUrl.searchParams.get("provider") ?? ""]
  if (!provider) return NextResponse.redirect(new URL("/sign-in", request.url))
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/"

  const workos = getWorkOS()
  const pkce = await workos.pkce.generate()
  const sealedState = await sealData(
    {
      nonce: crypto.randomUUID(),
      codeVerifier: pkce.codeVerifier,
      returnPathname: returnTo,
    },
    { password: process.env.WORKOS_COOKIE_PASSWORD!, ttl: 600 },
  )

  const url = workos.userManagement.getAuthorizationUrl({
    provider,
    clientId: process.env.WORKOS_CLIENT_ID!,
    redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI!,
    state: sealedState,
    codeChallenge: pkce.codeChallenge,
    codeChallengeMethod: pkce.codeChallengeMethod,
  })

  const response = NextResponse.redirect(url)
  response.cookies.set("wos-auth-verifier", sealedState, {
    path: "/",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
  })
  return response
}
