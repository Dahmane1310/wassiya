import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server"
import { authKit } from "../auth"
import {
  expandOwnerId,
  issuerOf,
  logAdminAction,
  requireAdmin,
  requireSuperadmin,
  resolveProfile,
  subjectOf,
} from "../lib/adminAuth"
import { loadEntitlement } from "../lib/entitlements"

// Users browser. Lists app `users` rows (one per vault owner) enriched with the
// synced WorkOS profile, switch state, and entitlement — all per-page-row lookups,
// bounded by the page size. Identity/profile fields only; never vault content.

export const listUsers = query({
  args: {
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const result = await ctx.db
      .query("users")
      .order(args.order ?? "desc")
      .paginate(args.paginationOpts)
    const page = []
    for (const u of result.page) {
      const profile = await resolveProfile(ctx, u.tokenIdentifier)
      const sw = await ctx.db
        .query("switchState")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", u.tokenIdentifier))
        .unique()
      const ent = await loadEntitlement(ctx, u.tokenIdentifier)
      const disabledRow = await ctx.db
        .query("disabledAccounts")
        .withIndex("by_accountId", (q) => q.eq("accountId", u.tokenIdentifier))
        .unique()
      page.push({
        tokenIdentifier: u.tokenIdentifier,
        _creationTime: u._creationTime,
        email: profile?.email ?? null,
        name: profile?.name ?? null,
        onboardingComplete: u.onboardingComplete ?? false,
        switchState: sw?.state ?? null,
        entitlement: { plan: ent.plan, status: ent.status },
        disabled: disabledRow !== null,
      })
    }
    return { ...result, page }
  },
})

const SEARCH_PAGE_LIMIT = 100
const SEARCH_MAX_PAGES = 5 // scans up to 500 accounts per search
const SEARCH_MAX_RESULTS = 8

type SearchHit = { tokenIdentifier: string; email: string; name: string | null }

function toSearchHit(issuer: string, user: { id: string; email: string; firstName?: string | null; lastName?: string | null }): SearchHit {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
  return {
    tokenIdentifier: `${issuer}|${user.id}`,
    email: user.email,
    name: name.length > 0 ? name : null,
  }
}

/** Free-text user search via the WorkOS API (the synced component store has no
 *  search index): substring match on NAME and EMAIL, exact lookup for a
 *  "user_…" id, exact email filter as a fast path. WorkOS itself only filters
 *  by exact email, so the fallback walks bounded pages server-side — fine for
 *  an internal panel. Admin-gated through an internal query (actions lack db). */
export const searchUsers = action({
  args: { query: v.string() },
  returns: v.array(
    v.object({
      tokenIdentifier: v.string(),
      email: v.string(),
      name: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const isAdmin: boolean = await ctx.runQuery(
      internal.admin.access.checkAdminInternal,
      {},
    )
    if (!isAdmin) throw new ConvexError("NOT_AUTHORIZED")
    const me = await ctx.auth.getUserIdentity()
    if (me === null) throw new ConvexError("NOT_AUTHORIZED")
    const issuer = issuerOf(me.tokenIdentifier)

    const q = args.query.trim().toLowerCase()
    if (q === "") return []

    // Pasted WorkOS id → exact lookup.
    if (q.startsWith("user_")) {
      try {
        const user = await authKit.workos.userManagement.getUser(q)
        return [toSearchHit(issuer, user)]
      } catch {
        return []
      }
    }

    // Full email typed → the one filter WorkOS supports natively.
    if (q.includes("@")) {
      const res = await authKit.workos.userManagement.listUsers({ email: q })
      if (res.data.length > 0) return res.data.map((u) => toSearchHit(issuer, u))
    }

    const hits: SearchHit[] = []
    let after: string | null | undefined
    for (let page = 0; page < SEARCH_MAX_PAGES; page++) {
      const res = await authKit.workos.userManagement.listUsers({
        limit: SEARCH_PAGE_LIMIT,
        ...(after ? { after } : {}),
      })
      for (const u of res.data) {
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase()
        if (u.email.toLowerCase().includes(q) || name.includes(q)) {
          hits.push(toSearchHit(issuer, u))
          if (hits.length >= SEARCH_MAX_RESULTS) return hits
        }
      }
      after = res.listMetadata.after
      if (!after) break
    }
    return hits
  },
})

// ---- Account CRUD ------------------------------------------------------------
// Create/update talk to the WorkOS API → actions (no db) that gate via an internal
// query and write audit through an internal mutation. Disable/enable are pure
// Convex state (the wall lives in lib/account.ts) → plain mutations.

/** Audit writer for the WorkOS-backed account actions. For creations it also
 *  registers the account in `provisionedAccounts` so the panel can show it
 *  before vault onboarding (no `users` row exists yet). */
export const recordAccountEvent = internalMutation({
  args: {
    ownerId: v.string(),
    actor: v.string(),
    event: v.union(v.literal("account_created"), v.literal("account_updated")),
    meta: v.optional(v.record(v.string(), v.string())),
    provisioned: v.optional(
      v.object({ email: v.string(), name: v.union(v.string(), v.null()) }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.provisioned !== undefined) {
      await ctx.db.insert("provisionedAccounts", {
        accountId: args.ownerId,
        email: args.provisioned.email,
        name: args.provisioned.name,
        createdBy: args.actor,
      })
    }
    await logAdminAction(ctx, {
      ownerId: args.ownerId,
      actor: args.actor,
      event: args.event,
      meta: args.meta,
    })
    return null
  },
})

/** Admin-created accounts that haven't onboarded a vault yet (their `users` row
 *  doesn't exist, so the main table can't show them). Rows are deleted by
 *  `vault.completeVaultSetup`; the residual existence check below covers accounts
 *  that onboarded before that cleanup shipped. */
export const listProvisionedAccounts = query({
  args: {},
  returns: v.array(
    v.object({
      accountId: v.string(),
      email: v.string(),
      name: v.union(v.string(), v.null()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db.query("provisionedAccounts").order("desc").take(100)
    const out = []
    for (const row of rows) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", row.accountId))
        .unique()
      if (user !== null) continue // onboarded — the main table owns them now
      out.push({
        accountId: row.accountId,
        email: row.email,
        name: row.name,
        createdAt: row._creationTime,
      })
    }
    return out
  },
})

/** A provisioned account that is still deletable: its row exists AND no vault was
 *  onboarded (a `users` row would own the identity — deletion is then off-limits). */
export const getDeletableProvisionedAccount = internalQuery({
  args: { ownerId: v.string() },
  returns: v.union(v.null(), v.object({ email: v.string() })),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("provisionedAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.ownerId))
      .unique()
    if (row === null) return null
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.ownerId))
      .unique()
    if (user !== null) return null // onboarded — no longer just an invite
    return { email: row.email }
  },
})

/** Cleanup half of provisioned-account deletion: drop the row + audit. Runs AFTER
 *  the WorkOS deletion succeeded so the panel never hides a live account. */
export const removeProvisionedAccount = internalMutation({
  args: { ownerId: v.string(), actor: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("provisionedAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.ownerId))
      .unique()
    if (row !== null) await ctx.db.delete(row._id)
    await logAdminAction(ctx, {
      ownerId: args.ownerId,
      actor: args.actor,
      event: "account_deleted",
      targetTable: "provisionedAccounts",
      meta: { email: args.email },
    })
    return null
  },
})

/** Delete a stale provisioned account (invited but never onboarded a vault) — the
 *  WorkOS account is removed too, so the email can be re-provisioned cleanly.
 *  SUPERADMIN-ONLY and refused outright once a vault exists. */
export const adminDeleteProvisionedAccount = action({
  args: { ownerId: v.string() }, // bare subject or full tokenIdentifier
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null || admin.role !== "superadmin") {
      throw new ConvexError("NOT_AUTHORIZED")
    }
    const ownerId = expandOwnerId(admin.tokenIdentifier, args.ownerId)
    const deletable: { email: string } | null = await ctx.runQuery(
      internal.admin.users.getDeletableProvisionedAccount,
      { ownerId },
    )
    if (deletable === null) throw new ConvexError("INVALID_STATE")

    try {
      await authKit.workos.userManagement.deleteUser(subjectOf(ownerId))
    } catch {
      // Tolerate an account that is already gone in WorkOS (retry after a partial
      // earlier failure); any other failure aborts BEFORE touching panel state.
      let stillExists = true
      try {
        await authKit.workos.userManagement.getUser(subjectOf(ownerId))
      } catch {
        stillExists = false
      }
      if (stillExists) throw new ConvexError("ACCOUNT_FAILED")
    }
    await ctx.runMutation(internal.admin.users.removeProvisionedAccount, {
      ownerId,
      actor: `admin:${admin.tokenIdentifier}`,
      email: deletable.email,
    })
    return null
  },
})

/** Provision a WorkOS account (passwordless: the person signs in with an emailed
 *  one-time code and onboards their vault themselves). No password is involved. */
export const adminCreateUser = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
  },
  returns: v.object({ tokenIdentifier: v.string(), email: v.string() }),
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null) throw new ConvexError("NOT_AUTHORIZED")
    const me = await ctx.auth.getUserIdentity()
    if (me === null) throw new ConvexError("NOT_AUTHORIZED")

    const email = args.email.trim().toLowerCase()
    const existing = await authKit.workos.userManagement.listUsers({ email })
    if (existing.data.length > 0) throw new ConvexError("EMAIL_IN_USE")

    let user
    try {
      user = await authKit.workos.userManagement.createUser({
        email,
        firstName: args.firstName.trim(),
        ...(args.lastName?.trim() ? { lastName: args.lastName.trim() } : {}),
      })
    } catch {
      // Never surface (or log) raw WorkOS errors.
      throw new ConvexError("ACCOUNT_FAILED")
    }
    const tokenIdentifier = `${issuerOf(me.tokenIdentifier)}|${user.id}`
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
    await ctx.runMutation(internal.admin.users.recordAccountEvent, {
      ownerId: tokenIdentifier,
      actor: `admin:${admin.tokenIdentifier}`,
      event: "account_created",
      meta: { email },
      provisioned: { email: user.email, name: name.length > 0 ? name : null },
    })
    return { tokenIdentifier, email: user.email }
  },
})

/** Fix a user's display name (support: typos). Email is immutable from the panel. */
export const adminUpdateUserName = action({
  args: {
    ownerId: v.string(), // bare subject or full tokenIdentifier
    firstName: v.string(),
    lastName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null) throw new ConvexError("NOT_AUTHORIZED")

    const ownerId = expandOwnerId(admin.tokenIdentifier, args.ownerId)
    try {
      await authKit.workos.userManagement.updateUser({
        userId: subjectOf(ownerId),
        firstName: args.firstName.trim(),
        lastName: args.lastName?.trim() ?? "",
      })
    } catch {
      throw new ConvexError("ACCOUNT_FAILED")
    }
    await ctx.runMutation(internal.admin.users.recordAccountEvent, {
      ownerId,
      actor: `admin:${admin.tokenIdentifier}`,
      event: "account_updated",
      meta: { field: "name" },
    })
    return null
  },
})

/** Reversible support disable: a `disabledAccounts` row blocks every owner-facing
 *  function (lib/account.ts). The WorkOS account + all vault data survive, so
 *  re-enabling restores access losslessly. SAFETY: also pauses the switch — a
 *  blocked owner can't check in, so an active switch would inevitably fire. */
export const adminDisableUser = mutation({
  args: { ownerId: v.string(), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const existing = await ctx.db
      .query("disabledAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", ownerId))
      .unique()
    if (existing !== null) throw new ConvexError("ALREADY_DISABLED")

    // Never disable mid death-review or after release — those flows must stay
    // attributable to a live, inspectable account state.
    const death = await ctx.db
      .query("deathVerification")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (death?.status === "under_review") throw new ConvexError("INVALID_STATE")
    const sw = await ctx.db
      .query("switchState")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .unique()
    if (sw?.state === "released") throw new ConvexError("INVALID_STATE")

    const reason = args.reason?.trim()
    const actor = `admin:${me.tokenIdentifier}`
    const id = await ctx.db.insert("disabledAccounts", {
      accountId: ownerId,
      disabledBy: actor,
      ...(reason ? { reason } : {}),
    })
    if (
      sw !== null &&
      (sw.state === "active" || sw.state === "grace" || sw.state === "pendingVerification")
    ) {
      await ctx.db.patch(sw._id, {
        state: "paused",
        graceStartedAt: undefined,
        pendingVerificationStartedAt: undefined,
      })
      await logAdminAction(ctx, {
        ownerId,
        actor,
        event: "switch_state_changed",
        targetTable: "switchState",
        targetId: sw._id,
        meta: { from: sw.state, to: "paused", cause: "account_disabled" },
      })
    }
    await logAdminAction(ctx, {
      ownerId,
      actor,
      event: "account_disabled",
      targetTable: "disabledAccounts",
      targetId: id,
      ...(reason ? { meta: { reason } } : {}),
    })
    return null
  },
})

/** Lift a support disable. The switch deliberately STAYS paused — support resumes
 *  it explicitly (resume opens a fresh check-in window). */
export const adminEnableUser = mutation({
  args: { ownerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    const ownerId = expandOwnerId(me.tokenIdentifier, args.ownerId)
    const row = await ctx.db
      .query("disabledAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", ownerId))
      .unique()
    if (row === null) throw new ConvexError("NOT_DISABLED")
    await ctx.db.delete(row._id)
    await logAdminAction(ctx, {
      ownerId,
      actor: `admin:${me.tokenIdentifier}`,
      event: "account_enabled",
      targetTable: "disabledAccounts",
      targetId: row._id,
    })
    return null
  },
})
