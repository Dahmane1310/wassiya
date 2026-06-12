import { v } from "convex/values"
import { internalQuery, mutation, query } from "../_generated/server"
import { authKit } from "../auth"
import { getAdminRow } from "../lib/adminAuth"

// Admin-panel access + the superadmin bootstrap. The ONE superadmin comes from the
// `SUPERADMIN_EMAIL` env var on the CONVEX DEPLOYMENT (`npx convex env set …` — a
// `.env.local` entry is silently ignored). Other admins are invited by email from
// the panel; their row is "activated" (tokenIdentifier filled in) on first sign-in.

function superadminEmail(): string | null {
  return process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ?? null
}

type Eligibility =
  | { status: "none" }
  | { status: "active"; role: "superadmin" | "admin"; email: string | null }
  | {
      status: "needsActivation"
      role: "superadmin" | "admin"
      email: string | null
      // What activation must do: fill an invite row, upgrade an existing row to
      // superadmin, or insert the bootstrap superadmin row.
      kind: "invite" | "upgrade" | "bootstrap"
    }

/** Shared eligibility check — the QUERY reports it, the MUTATION re-derives it
 *  server-side before writing (never trusts the client). */
async function checkEligibility(
  ctx: Parameters<typeof getAdminRow>[0],
): Promise<Eligibility> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return { status: "none" }
  const profile = await authKit.getAuthUser(ctx)
  const email =
    profile !== null && profile.emailVerified
      ? profile.email.toLowerCase()
      : null

  const row = await getAdminRow(ctx)
  if (row !== null) {
    const role = row.role ?? "admin"
    // Upgrade path: a pre-existing (seeded) admin row whose email is the
    // configured superadmin — promote instead of staying a plain admin.
    if (role !== "superadmin" && email !== null && email === superadminEmail()) {
      return { status: "needsActivation", role: "superadmin", email, kind: "upgrade" }
    }
    return { status: "active", role, email }
  }

  if (email === null) return { status: "none" }

  const invite = await ctx.db
    .query("admins")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique()
  if (invite !== null && invite.tokenIdentifier === undefined) {
    return {
      status: "needsActivation",
      role: invite.role ?? "admin",
      email,
      kind: "invite",
    }
  }

  if (email === superadminEmail()) {
    return { status: "needsActivation", role: "superadmin", email, kind: "bootstrap" }
  }
  return { status: "none" }
}

/** The signed-in user's panel access. The client gate renders on this; security
 *  stays server-side in every admin function. */
export const getMyAdminStatus = query({
  args: {},
  returns: v.object({
    status: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("needsActivation"),
    ),
    role: v.union(v.literal("superadmin"), v.literal("admin"), v.null()),
    email: v.union(v.string(), v.null()),
  }),
  handler: async (ctx) => {
    const e = await checkEligibility(ctx)
    if (e.status === "none") return { status: "none" as const, role: null, email: null }
    return { status: e.status, role: e.role, email: e.email }
  },
})

/** Activate panel access for the signed-in user: fill the invite row, perform the
 *  superadmin bootstrap/upgrade. Idempotent; re-derives eligibility server-side. */
export const activateAdminAccess = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) throw new Error("Not authenticated")
    const e = await checkEligibility(ctx)
    if (e.status !== "needsActivation") return null // nothing to do (idempotent)

    if (e.kind === "invite") {
      const invite = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", e.email ?? undefined))
        .unique()
      if (invite === null || invite.tokenIdentifier !== undefined) return null
      await ctx.db.patch(invite._id, { tokenIdentifier: identity.tokenIdentifier })
      return null // the invite itself was audited by addAdmin
    }

    if (e.kind === "upgrade") {
      const row = await getAdminRow(ctx)
      if (row === null) return null
      await ctx.db.patch(row._id, { role: "superadmin", email: e.email ?? row.email })
      await ctx.db.insert("auditLog", {
        ownerId: identity.tokenIdentifier,
        actor: "system:bootstrap",
        event: "admin_added",
        targetTable: "admins",
        targetId: row._id,
        meta: { action: "role_upgraded_to_superadmin" },
      })
      return null
    }

    // bootstrap: first sign-in of the configured superadmin
    const id = await ctx.db.insert("admins", {
      tokenIdentifier: identity.tokenIdentifier,
      email: e.email ?? undefined,
      role: "superadmin",
      addedBy: "bootstrap:SUPERADMIN_EMAIL",
    })
    await ctx.db.insert("auditLog", {
      ownerId: identity.tokenIdentifier,
      actor: "system:bootstrap",
      event: "admin_added",
      targetTable: "admins",
      targetId: id,
      meta: { role: "superadmin" },
    })
    return null
  },
})

/** Admin check for ACTIONS (which have no ctx.db). */
export const checkAdminInternal = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const row = await getAdminRow(ctx)
    return row !== null && row.tokenIdentifier !== undefined
  },
})

/** Admin identity for ACTIONS that need the actor string / role (audit, gates). */
export const getAdminInternal = internalQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      tokenIdentifier: v.string(),
      role: v.union(v.literal("superadmin"), v.literal("admin")),
    }),
  ),
  handler: async (ctx) => {
    const row = await getAdminRow(ctx)
    if (row === null || row.tokenIdentifier === undefined) return null
    return { tokenIdentifier: row.tokenIdentifier, role: row.role ?? "admin" }
  },
})
