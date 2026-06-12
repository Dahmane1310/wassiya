import { ConvexError } from "convex/values"
import { components } from "../_generated/api"
import { type Doc } from "../_generated/dataModel"
import { type MutationCtx, type QueryCtx } from "../_generated/server"

// Shared admin authorization helpers. Plain functions (same pattern as
// lib/entitlements.ts) typed against QueryCtx so they compose inside any query or
// mutation transaction. SECURITY LIVES HERE: the panel's client-side gate is UX
// only — every admin function must call requireAdmin/requireSuperadmin FIRST.
//
// Roles: "superadmin" (manages other admins) and "admin" (everything else). A row
// with no `role` is a legacy/seeded admin and is treated as "admin".

export type AdminRole = "superadmin" | "admin"

export type AdminIdentity = {
  tokenIdentifier: string
  role: AdminRole
  row: Doc<"admins">
}

/** The signed-in identity's admins row, or null (not signed in / not an admin). */
export async function getAdminRow(ctx: QueryCtx): Promise<Doc<"admins"> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return null
  return await ctx.db
    .query("admins")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()
}

/** Require an ACTIVATED admin. Throws NOT_AUTHORIZED (loud, never silently empty). */
export async function requireAdmin(ctx: QueryCtx): Promise<AdminIdentity> {
  const row = await getAdminRow(ctx)
  if (row === null || row.tokenIdentifier === undefined) {
    throw new ConvexError("NOT_AUTHORIZED")
  }
  return {
    tokenIdentifier: row.tokenIdentifier,
    role: row.role ?? "admin",
    row,
  }
}

/** Require the superadmin (admin management). */
export async function requireSuperadmin(ctx: QueryCtx): Promise<AdminIdentity> {
  const admin = await requireAdmin(ctx)
  if (admin.role !== "superadmin") throw new ConvexError("NOT_AUTHORIZED")
  return admin
}

/** WorkOS subject from a tokenIdentifier ("<issuer>|<subject>"). Feed it to the
 *  authKit component's `lib.getAuthUser({ id })` to resolve email/name. */
export function subjectOf(tokenIdentifier: string): string {
  return tokenIdentifier.split("|").pop() ?? tokenIdentifier
}

/** Issuer half of a tokenIdentifier — for reconstructing ids from WorkOS user ids. */
export function issuerOf(tokenIdentifier: string): string {
  const i = tokenIdentifier.lastIndexOf("|")
  return i === -1 ? tokenIdentifier : tokenIdentifier.slice(0, i)
}

/**
 * Admin-panel inputs may be a FULL tokenIdentifier ("<issuer>|<subject>") or just
 * the bare WorkOS subject ("user_…") — the panel uses bare subjects in URLs so
 * they stay readable. All users share the calling admin's issuer, so expand
 * bare subjects against it before any db lookup.
 */
export function expandOwnerId(adminTokenIdentifier: string, value: string): string {
  const v = value.trim()
  return v.includes("|") ? v : `${issuerOf(adminTokenIdentifier)}|${v}`
}

export type ResolvedProfile = {
  email: string | null
  name: string | null
  createdAt: string | null
  lastSignInAt: string | null
  profilePictureUrl: string | null // SSO-provided (Google/Apple); not uploadable
}

/** Resolve ANY user's synced WorkOS profile from their tokenIdentifier via the
 *  authKit component store. Bounded use only (per page row / per detail view). */
export async function resolveProfile(
  ctx: QueryCtx,
  tokenIdentifier: string,
): Promise<ResolvedProfile | null> {
  const user = await ctx.runQuery(components.workOSAuthKit.lib.getAuthUser, {
    id: subjectOf(tokenIdentifier),
  })
  if (user === null) return null
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ")
  return {
    email: user.email ?? null,
    name: name.length > 0 ? name : null,
    createdAt: user.createdAt ?? null,
    lastSignInAt: user.lastSignInAt ?? null,
    profilePictureUrl: user.profilePictureUrl ?? null,
  }
}

/** Append an admin action to the audit log (append-only; non-secret meta only). */
export async function logAdminAction(
  ctx: MutationCtx,
  args: {
    ownerId: string
    actor: string
    event: Doc<"auditLog">["event"]
    targetTable?: string
    targetId?: string
    meta?: Record<string, string>
  },
): Promise<void> {
  await ctx.db.insert("auditLog", {
    ownerId: args.ownerId,
    actor: args.actor,
    event: args.event,
    targetTable: args.targetTable,
    targetId: args.targetId,
    meta: args.meta,
  })
}
