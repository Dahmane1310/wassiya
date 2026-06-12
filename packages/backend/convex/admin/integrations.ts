import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { action, internalQuery, mutation, query, type QueryCtx } from "../_generated/server"
import {
  readSetting,
  SETTING_KEYS,
  type SettingKey,
} from "../integrationSettings"
import { logAdminAction, requireAdmin, requireSuperadmin, resolveProfile } from "../lib/adminAuth"

// External-service health + configuration for the admin Integrations page.
// Resend / RevenueCat / deploy-hook secrets are PANEL-MANAGED (the
// integrationSettings table wins over the deployment env fallback) — set and
// cleared here by superadmins, write-only: values are never echoed back.
// WorkOS stays env-only: auth bootstraps from the deployment env before any
// table can be read.

const CAP = 1000

async function countNotifications(
  ctx: QueryCtx,
  status: "pending" | "sent" | "failed",
): Promise<{ value: number; capped: boolean }> {
  const rows = await ctx.db
    .query("notifications")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(CAP + 1)
  return { value: Math.min(rows.length, CAP), capped: rows.length > CAP }
}

const countShape = v.object({ value: v.number(), capped: v.boolean() })
const sourceShape = v.union(v.literal("panel"), v.literal("env"), v.null())

export const getIntegrations = query({
  args: {},
  returns: v.object({
    resend: v.object({
      configured: v.boolean(),
      source: sourceShape,
      emailFrom: v.union(v.string(), v.null()), // non-secret, display only
      sent: countShape,
      failed: countShape,
      pending: countShape,
    }),
    revenuecat: v.object({
      configured: v.boolean(),
      source: sourceShape,
      lastEventAt: v.union(v.number(), v.null()),
    }),
    workos: v.object({
      configured: v.boolean(),
      clientId: v.union(v.string(), v.null()),
    }),
    deployHook: v.object({
      configured: v.boolean(),
      source: sourceShape,
      lastDeployAt: v.union(v.number(), v.null()),
      lastDeployOk: v.union(v.boolean(), v.null()),
    }),
    convex: v.object({ deployment: v.union(v.string(), v.null()) }),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const resendKey = await readSetting(ctx, "RESEND_API_KEY")
    const emailFrom = await readSetting(ctx, "EMAIL_FROM")
    const rcAuth = await readSetting(ctx, "REVENUECAT_WEBHOOK_AUTH")
    const hookUrl = await readSetting(ctx, "LANDING_DEPLOY_HOOK_URL")

    // Last server-verified store event (apple/google) — bounded recent scan.
    const recentBilling = await ctx.db.query("billingEvents").order("desc").take(100)
    const lastStoreEvent = recentBilling.find(
      (e) => e.source === "apple" || e.source === "google",
    )

    // Deploy-hook outcome lives on the published landing rows.
    const publishedLanding = await ctx.db
      .query("landingContent")
      .withIndex("by_lang_and_channel", (q) => q.eq("lang", "en").eq("channel", "published"))
      .unique()

    return {
      resend: {
        configured: resendKey.value !== null && emailFrom.value !== null,
        source: resendKey.source,
        emailFrom: emailFrom.value,
        sent: await countNotifications(ctx, "sent"),
        failed: await countNotifications(ctx, "failed"),
        pending: await countNotifications(ctx, "pending"),
      },
      revenuecat: {
        configured: rcAuth.value !== null,
        source: rcAuth.source,
        lastEventAt: lastStoreEvent?._creationTime ?? null,
      },
      workos: {
        configured: !!process.env.WORKOS_CLIENT_ID,
        clientId: process.env.WORKOS_CLIENT_ID ?? null,
      },
      deployHook: {
        configured: hookUrl.value !== null,
        source: hookUrl.source,
        lastDeployAt: publishedLanding?.lastDeployAt ?? null,
        lastDeployOk: publishedLanding?.lastDeployOk ?? null,
      },
      convex: { deployment: process.env.CONVEX_CLOUD_URL ?? null },
    }
  },
})

// ── Panel-managed settings (SUPERADMIN, write-only) ─────────────────────────

function assertKey(key: string): asserts key is SettingKey {
  if (!(SETTING_KEYS as readonly string[]).includes(key)) {
    throw new ConvexError("INVALID_KEY")
  }
}

export const setIntegrationSetting = mutation({
  args: { key: v.string(), value: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    assertKey(args.key)
    const value = args.value.trim()
    if (value === "") throw new ConvexError("EMPTY_VALUE")

    const existing = await ctx.db
      .query("integrationSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
    const fields = {
      value,
      updatedBy: `admin:${me.tokenIdentifier}`,
      updatedAt: Date.now(),
    }
    if (existing !== null) await ctx.db.patch(existing._id, fields)
    else await ctx.db.insert("integrationSettings", { key: args.key, ...fields })

    await logAdminAction(ctx, {
      ownerId: "integrations",
      actor: `admin:${me.tokenIdentifier}`,
      event: "integration_updated",
      targetTable: "integrationSettings",
      meta: { key: args.key, action: "set" }, // NEVER the value
    })
    return null
  },
})

export const clearIntegrationSetting = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    assertKey(args.key)
    const existing = await ctx.db
      .query("integrationSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
    if (existing === null) return null
    await ctx.db.delete(existing._id)
    await logAdminAction(ctx, {
      ownerId: "integrations",
      actor: `admin:${me.tokenIdentifier}`,
      event: "integration_updated",
      targetTable: "integrationSettings",
      meta: { key: args.key, action: "cleared" },
    })
    return null
  },
})

// ── Test actions ─────────────────────────────────────────────────────────────

/** The signed-in admin's email — recipient for the test send. */
export const getMyEmailInternal = internalQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const me = await requireAdmin(ctx)
    const profile = await resolveProfile(ctx, me.tokenIdentifier)
    return profile?.email ?? me.row.email ?? null
  },
})

/** Send a real Resend email to the CALLING admin — proves the key, the from
 *  address and deliverability in one click. */
export const sendTestEmail = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null) throw new ConvexError("NOT_AUTHORIZED")

    const settings = await ctx.runQuery(internal.integrationSettings.getAllInternal, {})
    const apiKey = settings.RESEND_API_KEY
    const from = settings.EMAIL_FROM
    if (!apiKey || !from) throw new ConvexError("NOT_CONFIGURED")

    const to: string | null = await ctx.runQuery(
      internal.admin.integrations.getMyEmailInternal,
      {},
    )
    if (to === null) throw new ConvexError("NO_RECIPIENT")

    let ok = false
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: "Wassiya admin — test email",
          text: "This is a test email from the Wassiya admin panel. Your Resend integration works.",
        }),
      })
      ok = res.ok
    } catch {
      ok = false
    }
    if (!ok) throw new ConvexError("SEND_FAILED")
    return null
  },
})

/** Fire the landing deploy hook once and record the outcome (same field the
 *  publish flow records to). */
export const testDeployHook = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null) throw new ConvexError("NOT_AUTHORIZED")

    const settings = await ctx.runQuery(internal.integrationSettings.getAllInternal, {})
    const url = settings.LANDING_DEPLOY_HOOK_URL
    if (!url) throw new ConvexError("NOT_CONFIGURED")

    let ok = false
    try {
      const res = await fetch(url, { method: "POST" })
      ok = res.ok
    } catch {
      ok = false
    }
    await ctx.runMutation(internal.admin.landing.recordDeployResult, { ok })
    if (!ok) throw new ConvexError("HOOK_FAILED")
    return null
  },
})
