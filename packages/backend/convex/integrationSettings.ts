import { v } from "convex/values"
import { internalQuery, type QueryCtx } from "./_generated/server"

// Panel-manageable integration secrets. A value set from the admin panel
// (integrationSettings table) WINS over the deployment env var, which stays
// as the fallback — so existing `npx convex env set` configs keep working.
// WorkOS credentials are deliberately NOT here: auth bootstraps from the
// deployment env before any table can be read.

export const SETTING_KEYS = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "REVENUECAT_WEBHOOK_AUTH",
  "LANDING_DEPLOY_HOOK_URL",
] as const

export type SettingKey = (typeof SETTING_KEYS)[number]

export type SettingSource = "panel" | "env" | null

/** Effective value + where it came from. Table row wins over env. */
export async function readSetting(
  ctx: QueryCtx,
  key: SettingKey,
): Promise<{ value: string | null; source: SettingSource }> {
  const row = await ctx.db
    .query("integrationSettings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique()
  if (row !== null) return { value: row.value, source: "panel" }
  const env = process.env[key]
  return env ? { value: env, source: "env" } : { value: null, source: null }
}

/** Effective values for ACTIONS and HTTP handlers (no db ctx). NEVER return
 *  this to a client — secrets included. */
export const getAllInternal = internalQuery({
  args: {},
  returns: v.record(v.string(), v.union(v.string(), v.null())),
  handler: async (ctx) => {
    const out: Record<string, string | null> = {}
    for (const key of SETTING_KEYS) out[key] = (await readSetting(ctx, key)).value
    return out
  },
})
