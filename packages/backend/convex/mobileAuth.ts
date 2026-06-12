import { type HttpRouter } from "convex/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { httpAction, internalMutation } from "./_generated/server"
import { authKit } from "./auth"
import { enqueueNotification } from "./lib/notify"

// Credential-auth proxy for the MOBILE app. The app is SECRET-LESS (it must
// never hold WORKOS_API_KEY), so password / magic-code / verification grants
// run here, where authKit.workos is configured with the key. These are HTTP
// actions ON PURPOSE: regular Convex actions record their ARGUMENTS in the
// function logs — passwords must never appear there. NEVER log request bodies.

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

type WorkOSErrorInfo = {
  code: string
  pendingAuthenticationToken?: string
  email?: string
}

/** Map a WorkOS SDK exception to a SAFE, friendly error code. */
function mapWorkOSError(e: unknown): WorkOSErrorInfo {
  const raw = (e as { rawData?: Record<string, unknown> })?.rawData ?? {}
  const code = typeof raw.code === "string" ? raw.code : "auth_failed"
  if (code === "email_verification_required") {
    return {
      code,
      pendingAuthenticationToken:
        typeof raw.pending_authentication_token === "string"
          ? raw.pending_authentication_token
          : undefined,
      email: typeof raw.email === "string" ? raw.email : undefined,
    }
  }
  const known = new Set([
    "invalid_credentials",
    "email_not_verified",
    "user_not_found",
    "email_verification_code_expired",
    "magic_auth_code_expired",
    "invalid_one_time_code",
    "password_strength_error",
    "user_creation_error",
  ])
  return { code: known.has(code) ? code : "auth_failed" }
}

function tokensResponse(auth: { accessToken: string; refreshToken: string }) {
  return json(200, {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
  })
}

function clientId(): string {
  return process.env.WORKOS_CLIENT_ID ?? ""
}

export const enqueuePasswordResetEmail = internalMutation({
  args: { recipientEmail: v.string(), url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await enqueueNotification(ctx, {
      recipientEmail: args.recipientEmail,
      kind: "password_reset",
      payload: { url: args.url },
    })
    return null
  },
})

export function registerMobileAuthRoutes(http: HttpRouter): void {
  http.route({
    path: "/mobile-auth/password-sign-in",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { email, password } = (await req.json()) as { email?: string; password?: string }
      if (!email || !password) return json(400, { error: "auth_failed" })
      try {
        const auth = await authKit.workos.userManagement.authenticateWithPassword({
          clientId: clientId(),
          email: email.trim().toLowerCase(),
          password,
        })
        return tokensResponse(auth)
      } catch (e) {
        const info = mapWorkOSError(e)
        if (info.code === "email_verification_required") {
          return json(200, { pendingAuthenticationToken: info.pendingAuthenticationToken })
        }
        return json(401, { error: info.code })
      }
    }),
  })

  http.route({
    path: "/mobile-auth/password-sign-up",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { email, password, firstName, lastName } = (await req.json()) as {
        email?: string
        password?: string
        firstName?: string
        lastName?: string
      }
      if (!email || !password) return json(400, { error: "auth_failed" })
      const normalized = email.trim().toLowerCase()
      try {
        await authKit.workos.userManagement.createUser({
          email: normalized,
          password,
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
        })
      } catch (e) {
        return json(400, { error: mapWorkOSError(e).code })
      }
      try {
        const auth = await authKit.workos.userManagement.authenticateWithPassword({
          clientId: clientId(),
          email: normalized,
          password,
        })
        return tokensResponse(auth)
      } catch (e) {
        const info = mapWorkOSError(e)
        if (info.code === "email_verification_required") {
          return json(200, { pendingAuthenticationToken: info.pendingAuthenticationToken })
        }
        return json(401, { error: info.code })
      }
    }),
  })

  http.route({
    path: "/mobile-auth/magic-code",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { email } = (await req.json()) as { email?: string }
      if (!email) return json(400, { error: "auth_failed" })
      try {
        // Creates AND emails the one-time code (WorkOS-sent).
        await authKit.workos.userManagement.createMagicAuth({
          email: email.trim().toLowerCase(),
        })
      } catch {
        // Always succeed — don't leak whether an account exists.
      }
      return json(200, { ok: true })
    }),
  })

  http.route({
    path: "/mobile-auth/magic-sign-in",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { email, code } = (await req.json()) as { email?: string; code?: string }
      if (!email || !code) return json(400, { error: "auth_failed" })
      try {
        const auth = await authKit.workos.userManagement.authenticateWithMagicAuth({
          clientId: clientId(),
          email: email.trim().toLowerCase(),
          code: code.trim(),
        })
        return tokensResponse(auth)
      } catch (e) {
        return json(401, { error: mapWorkOSError(e).code })
      }
    }),
  })

  http.route({
    path: "/mobile-auth/verify-email",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { pendingAuthenticationToken, code } = (await req.json()) as {
        pendingAuthenticationToken?: string
        code?: string
      }
      if (!pendingAuthenticationToken || !code) return json(400, { error: "auth_failed" })
      try {
        const auth = await authKit.workos.userManagement.authenticateWithEmailVerification({
          clientId: clientId(),
          pendingAuthenticationToken,
          code: code.trim(),
        })
        return tokensResponse(auth)
      } catch (e) {
        return json(401, { error: mapWorkOSError(e).code })
      }
    }),
  })

  http.route({
    path: "/mobile-auth/refresh",
    method: "POST",
    handler: httpAction(async (_ctx, req) => {
      const { refreshToken } = (await req.json()) as { refreshToken?: string }
      if (!refreshToken) return json(400, { error: "auth_failed" })
      try {
        const auth = await authKit.workos.userManagement.authenticateWithRefreshToken({
          clientId: clientId(),
          refreshToken,
        })
        return tokensResponse(auth)
      } catch (e) {
        return json(401, { error: mapWorkOSError(e).code })
      }
    }),
  })

  // Shared by web/admin/mobile: creates the reset token and emails OUR link
  // through the notification pipeline. Always responds ok — no user enumeration.
  http.route({
    path: "/mobile-auth/password-reset-request",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
      const { email } = (await req.json()) as { email?: string }
      if (!email) return json(400, { error: "auth_failed" })
      try {
        const reset = await authKit.workos.userManagement.createPasswordReset({
          email: email.trim().toLowerCase(),
        })
        const base = process.env.APP_WEB_URL ?? "http://localhost:3001"
        await ctx.runMutation(internal.mobileAuth.enqueuePasswordResetEmail, {
          recipientEmail: email.trim().toLowerCase(),
          url: `${base}/reset-password?token=${encodeURIComponent(reset.passwordResetToken)}`,
        })
      } catch {
        // Silent — same response whether or not the account exists.
      }
      return json(200, { ok: true })
    }),
  })
}
