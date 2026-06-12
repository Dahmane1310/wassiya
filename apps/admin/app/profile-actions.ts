"use server"

import { getWorkOS, withAuth } from "@workos-inc/authkit-nextjs"

// Self-service account actions for the signed-in admin (our UI, WorkOS
// underneath — same pattern as auth-actions.ts). NEVER log credentials or
// echo raw WorkOS errors.

export type ProfileResult = { ok: true } | { error: string }

/** Map a WorkOS exception to a SAFE error code for the profile forms. */
function mapError(e: unknown): ProfileResult {
  const raw = (e as { rawData?: Record<string, unknown> })?.rawData ?? {}
  const code = typeof raw.code === "string" ? raw.code : "profile_failed"
  const known = new Set(["invalid_credentials", "password_strength_error"])
  return { error: known.has(code) ? code : "profile_failed" }
}

/** Change the signed-in admin's password. The CURRENT password is verified
 *  first, so a stolen session cookie alone can't take over the account.
 *  (SSO-only accounts have no password — they use the sign-in page's
 *  "Forgot password" flow to set one.) */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<ProfileResult> {
  const { user } = await withAuth()
  if (user === null || user === undefined) return { error: "profile_failed" }

  try {
    await getWorkOS().userManagement.authenticateWithPassword({
      clientId: process.env.WORKOS_CLIENT_ID ?? "",
      email: user.email,
      password: currentPassword,
    })
  } catch (e) {
    return mapError(e)
  }
  try {
    await getWorkOS().userManagement.updateUser({
      userId: user.id,
      password: newPassword,
    })
  } catch (e) {
    return mapError(e)
  }
  return { ok: true }
}
