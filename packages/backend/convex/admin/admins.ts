import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import {
  logAdminAction,
  requireSuperadmin,
  resolveProfile,
} from "../lib/adminAuth"

// Admin-allowlist management. SUPERADMIN-ONLY — plain admins can use the rest of
// the panel but never grant or revoke admin access.

/** Every admins row (the table is tiny — a hard 200 bound is generous). */
export const listAdmins = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("admins"),
      _creationTime: v.number(),
      tokenIdentifier: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      role: v.union(v.literal("superadmin"), v.literal("admin")),
      addedBy: v.union(v.string(), v.null()),
      note: v.union(v.string(), v.null()),
      activated: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requireSuperadmin(ctx)
    const rows = await ctx.db.query("admins").take(200)
    const out = []
    for (const r of rows) {
      let email = r.email ?? null
      if (email === null && r.tokenIdentifier !== undefined) {
        email = (await resolveProfile(ctx, r.tokenIdentifier))?.email ?? null
      }
      out.push({
        _id: r._id,
        _creationTime: r._creationTime,
        tokenIdentifier: r.tokenIdentifier ?? null,
        email,
        role: r.role ?? ("admin" as const),
        addedBy: r.addedBy ?? null,
        note: r.note ?? null,
        activated: r.tokenIdentifier !== undefined,
      })
    }
    return out
  },
})

/** Invite an admin by email. The row activates on their first sign-in. */
export const addAdmin = mutation({
  args: { email: v.string(), note: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    const email = args.email.trim().toLowerCase()
    if (!email.includes("@")) throw new ConvexError("INVALID_EMAIL")
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (existing !== null) throw new ConvexError("ALREADY_ADMIN")
    const id = await ctx.db.insert("admins", {
      email,
      role: "admin",
      addedBy: me.tokenIdentifier,
      note: args.note?.trim() || undefined,
    })
    await logAdminAction(ctx, {
      ownerId: `email:${email}`,
      actor: `admin:${me.tokenIdentifier}`,
      event: "admin_added",
      targetTable: "admins",
      targetId: id,
      meta: { email, role: "admin" },
    })
    return null
  },
})

/** Remove an admin. The superadmin row can never be removed. */
export const removeAdmin = mutation({
  args: { id: v.id("admins") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireSuperadmin(ctx)
    const target = await ctx.db.get(args.id)
    if (target === null) throw new ConvexError("NOT_FOUND")
    if ((target.role ?? "admin") === "superadmin") {
      throw new ConvexError("CANNOT_REMOVE_SUPERADMIN")
    }
    await ctx.db.delete(args.id)
    await logAdminAction(ctx, {
      ownerId: target.tokenIdentifier ?? `email:${target.email ?? "unknown"}`,
      actor: `admin:${me.tokenIdentifier}`,
      event: "admin_removed",
      targetTable: "admins",
      targetId: args.id,
      meta: target.email !== undefined ? { email: target.email } : undefined,
    })
    return null
  },
})
