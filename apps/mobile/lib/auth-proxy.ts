import { type WorkOSTokens } from "@/lib/auth"

// Native email/password + email-code sign-in, proxied through the Convex
// backend's /mobile-auth/* HTTP routes — the app stays SECRET-LESS (the
// WorkOS API key lives only on the Convex deployment). Convex serves HTTP
// actions from the .convex.site twin of the deployment URL.

const SITE_URL = (process.env.EXPO_PUBLIC_CONVEX_URL ?? "").replace(
  ".convex.cloud",
  ".convex.site"
)

/** Thrown with a SAFE error code the UI maps to a friendly message. */
export class AuthProxyError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

export type ProxyAuthResult =
  | { tokens: WorkOSTokens }
  | { pendingAuthenticationToken: string }

async function post(path: string, body: Record<string, string>): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(`${SITE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AuthProxyError("network")
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new AuthProxyError(typeof data.error === "string" ? data.error : "auth_failed")
  }
  return data
}

function toResult(data: unknown): ProxyAuthResult {
  const d = data as Record<string, unknown>
  if (typeof d.accessToken === "string" && typeof d.refreshToken === "string") {
    return { tokens: { accessToken: d.accessToken, refreshToken: d.refreshToken } }
  }
  if (typeof d.pendingAuthenticationToken === "string") {
    return { pendingAuthenticationToken: d.pendingAuthenticationToken }
  }
  throw new AuthProxyError("auth_failed")
}

export async function passwordSignIn(email: string, password: string): Promise<ProxyAuthResult> {
  return toResult(await post("/mobile-auth/password-sign-in", { email, password }))
}

export async function passwordSignUp(email: string, password: string): Promise<ProxyAuthResult> {
  return toResult(await post("/mobile-auth/password-sign-up", { email, password }))
}

export async function sendMagicCode(email: string): Promise<void> {
  await post("/mobile-auth/magic-code", { email })
}

export async function magicSignIn(email: string, code: string): Promise<ProxyAuthResult> {
  return toResult(await post("/mobile-auth/magic-sign-in", { email, code }))
}

export async function verifyEmailCode(
  pendingAuthenticationToken: string,
  code: string
): Promise<ProxyAuthResult> {
  return toResult(await post("/mobile-auth/verify-email", { pendingAuthenticationToken, code }))
}

/** Refresh for PROXY-minted sessions (confidential-client tokens). */
export async function proxyRefresh(refreshToken: string): Promise<WorkOSTokens> {
  const result = toResult(await post("/mobile-auth/refresh", { refreshToken }))
  if ("tokens" in result) return result.tokens
  throw new AuthProxyError("auth_failed")
}

export async function requestPasswordReset(email: string): Promise<void> {
  await post("/mobile-auth/password-reset-request", { email })
}
