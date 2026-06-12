import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { authKit } from "./auth"
import { registerMobileAuthRoutes } from "./mobileAuth"

const http = httpRouter()

// Serves the WorkOS webhook at <deployment>.convex.site/workos/webhook so
// user.created / user.updated / user.deleted events sync into Convex.
authKit.registerRoutes(http)

// Credential-auth proxy for the secret-less mobile app (+ the shared
// password-reset request used by web/admin). See mobileAuth.ts.
registerMobileAuthRoutes(http)

// ── RevenueCat (native IAP) webhook ─────────────────────────────────────────
// RevenueCat is the trust anchor for Apple/Google purchases: the device buys via
// StoreKit / Play Billing, and RC POSTs a server-verified event here. We attribute it
// to an owner via the RC `app_user_id` (= the WorkOS `sub`, linked by linkPurchaseId)
// and update the entitlement. The shared secret in the Authorization header is the only
// thing that authenticates the caller — set REVENUECAT_WEBHOOK_AUTH in the Convex
// deployment env and the identical value in the RevenueCat dashboard webhook config.

// Map a RevenueCat product identifier to our plan. Edit the explicit map to match the
// product ids you create in App Store Connect / Play Console / RevenueCat; the substring
// fallback is a safety net.
const PRODUCT_PLAN: Record<string, "annual" | "lifetime"> = {
  wassiya_annual: "annual",
  wassiya_lifetime: "lifetime",
}
function planForProduct(productId: string): "annual" | "lifetime" | null {
  if (PRODUCT_PLAN[productId]) return PRODUCT_PLAN[productId]
  const p = productId.toLowerCase()
  if (p.includes("lifetime")) return "lifetime"
  if (p.includes("annual") || p.includes("year")) return "annual"
  return null
}

function sourceForStore(store: string | undefined): "apple" | "google" | "manual" {
  if (store === "APP_STORE" || store === "MAC_APP_STORE") return "apple"
  if (store === "PLAY_STORE") return "google"
  return "manual"
}

// RC event types that confer / renew access vs. those that end it.
const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
])
const REVOKE_EVENTS = new Set(["EXPIRATION", "REFUND"])

http.route({
  path: "/revenuecat/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Panel-managed settings win over the deployment env (integrationSettings.ts).
    const settings = await ctx.runQuery(internal.integrationSettings.getAllInternal, {})
    const expected = settings.REVENUECAT_WEBHOOK_AUTH
    if (!expected || req.headers.get("Authorization") !== expected) {
      return new Response("Unauthorized", { status: 401 })
    }

    let body: { event?: Record<string, unknown> }
    try {
      body = await req.json()
    } catch {
      return new Response("Bad Request", { status: 400 })
    }
    const event = body.event
    if (!event) return new Response("OK", { status: 200 })

    const type = String(event.type ?? "")
    const rcAppUserId = String(event.app_user_id ?? "")
    const productId = String(event.product_id ?? "")
    const externalEventId =
      typeof event.id === "string" ? event.id : undefined
    const expirationMs =
      typeof event.expiration_at_ms === "number"
        ? event.expiration_at_ms
        : undefined
    const source = sourceForStore(
      typeof event.store === "string" ? event.store : undefined,
    )

    if (!rcAppUserId) return new Response("OK", { status: 200 })

    if (GRANT_EVENTS.has(type)) {
      const plan = planForProduct(productId)
      if (plan === null) return new Response("OK", { status: 200 })
      // Well-formed annual events always carry expiration_at_ms; guard so a malformed
      // one can't throw in the mutation and trigger an infinite RC retry loop.
      if (plan === "annual" && expirationMs == null) {
        return new Response("OK", { status: 200 })
      }
      await ctx.runMutation(internal.entitlements.grantEntitlementByRcId, {
        rcAppUserId,
        plan,
        source,
        // lifetime carries no expiry; an annual MUST (the mutation enforces it).
        currentPeriodEnd: plan === "lifetime" ? undefined : expirationMs,
        externalSubscriptionId: productId || undefined,
        externalEventId,
      })
    } else if (REVOKE_EVENTS.has(type)) {
      await ctx.runMutation(internal.entitlements.revokeEntitlementByRcId, {
        rcAppUserId,
        status: "expired",
        externalEventId,
      })
    }
    // Other event types (CANCELLATION = won't-renew-but-still-active, BILLING_ISSUE,
    // TEST, …) are acknowledged without a state change.

    return new Response("OK", { status: 200 })
  }),
})

// ── Landing-page content (public, read-only) ────────────────────────────────
// Serves the PUBLISHED admin-managed copy to `astro build` (apps/landing
// src/i18n/load.ts). No auth: this is already-public marketing copy, bounded
// to one small JSON document per language. 404 until first publish — the
// landing build falls back to its checked-in dicts.
http.route({
  path: "/landing-content",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const lang = new URL(req.url).searchParams.get("lang")
    if (lang !== "en" && lang !== "ar") {
      return new Response("Bad Request", { status: 400 })
    }
    const data = await ctx.runQuery(internal.admin.landing.getPublished, { lang })
    const images = await ctx.runQuery(internal.admin.landing.getPublishedImages, {})
    // 404 only when NOTHING is published; an images-only publish (no text
    // draft yet) must still reach the site — content stays null and the
    // landing keeps its checked-in copy for the text.
    if (data === null && Object.keys(images).length === 0) {
      return new Response("Not Found", { status: 404 })
    }
    return new Response(JSON.stringify({ content: data, images }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }),
})

export default http
