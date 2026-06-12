"use server"

import { getWorkOS, saveSession } from "@workos-inc/authkit-nextjs"

// Custom auth flows (our UI, WorkOS underneath). Each action authenticates via
// the User Management API server-side and persists the SAME encrypted session
// cookie the AuthKit middleware / useAuth / Convex bridge consume — nothing
// downstream changes. NEVER log credentials or echo raw WorkOS errors.

export type AuthResult =
  | { ok: true }
  | { error: string }
  | { verifyEmail: { pendingAuthenticationToken: string; email: string } }

function clientId(): string {
  return process.env.WORKOS_CLIENT_ID ?? ""
}

/** Cookie-attribute context for saveSession (secure flag etc.). */
function cookieUrl(): string {
  return process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? "http://localhost:3002/callback"
}

/** Map a WorkOS exception to a SAFE error code (or the verify-email handoff). */
function mapError(e: unknown, email: string): AuthResult {
  const raw = (e as { rawData?: Record<string, unknown> })?.rawData ?? {}
  const code = typeof raw.code === "string" ? raw.code : "auth_failed"
  if (
    code === "email_verification_required" &&
    typeof raw.pending_authentication_token === "string"
  ) {
    return {
      verifyEmail: {
        pendingAuthenticationToken: raw.pending_authentication_token,
        email,
      },
    }
  }
  const known = new Set([
    "invalid_credentials",
    "user_not_found",
    "email_verification_code_expired",
    "magic_auth_code_expired",
    "invalid_one_time_code",
    "password_strength_error",
    "user_creation_error",
    "password_reset_token_expired",
  ])
  return { error: known.has(code) ? code : "auth_failed" }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const normalized = email.trim().toLowerCase()
  try {
    const auth = await getWorkOS().userManagement.authenticateWithPassword({
      clientId: clientId(),
      email: normalized,
      password,
    })
    await saveSession(auth, cookieUrl())
    return { ok: true }
  } catch (e) {
    return mapError(e, normalized)
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthResult> {
  const normalized = email.trim().toLowerCase()
  try {
    await getWorkOS().userManagement.createUser({
      email: normalized,
      password,
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
    })
  } catch (e) {
    return mapError(e, normalized)
  }
  // Authenticate right away — typically hands off to email verification.
  return signInWithPassword(normalized, password)
}

export async function verifyEmailCode(
  pendingAuthenticationToken: string,
  code: string,
): Promise<AuthResult> {
  try {
    const auth = await getWorkOS().userManagement.authenticateWithEmailVerification({
      clientId: clientId(),
      pendingAuthenticationToken,
      code: code.trim(),
    })
    await saveSession(auth, cookieUrl())
    return { ok: true }
  } catch (e) {
    return mapError(e, "")
  }
}

export async function sendMagicCode(email: string): Promise<{ ok: true }> {
  try {
    // Creates AND emails the one-time code. Always "ok" — no account enumeration.
    await getWorkOS().userManagement.createMagicAuth({
      email: email.trim().toLowerCase(),
    })
  } catch {
    // Silent by design.
  }
  return { ok: true }
}

export async function signInWithMagicCode(email: string, code: string): Promise<AuthResult> {
  const normalized = email.trim().toLowerCase()
  try {
    const auth = await getWorkOS().userManagement.authenticateWithMagicAuth({
      clientId: clientId(),
      email: normalized,
      code: code.trim(),
    })
    await saveSession(auth, cookieUrl())
    return { ok: true }
  } catch (e) {
    return mapError(e, normalized)
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  // Token creation + email delivery live on the Convex backend (shared with
  // mobile; reuses the notification pipeline). Always "ok" — no enumeration.
  try {
    const site = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(".convex.cloud", ".convex.site")
    await fetch(`${site}/mobile-auth/password-reset-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
  } catch {
    // Silent by design.
  }
  return { ok: true }
}

export async function completePasswordReset(
  token: string,
  newPassword: string,
): Promise<AuthResult> {
  try {
    const { user } = await getWorkOS().userManagement.resetPassword({
      token,
      newPassword,
    })
    // Resetting verified the email — sign them straight in.
    return signInWithPassword(user.email, newPassword)
  } catch (e) {
    return mapError(e, "")
  }
}
