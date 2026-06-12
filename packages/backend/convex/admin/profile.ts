import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { action, internalMutation, mutation, query } from "../_generated/server"
import { authKit } from "../auth"
import {
  logAdminAction,
  requireAdmin,
  resolveProfile,
  subjectOf,
} from "../lib/adminAuth"

// The signed-in admin's OWN profile page. Identity comes from the synced WorkOS
// profile; panel facts (role, since, invited-by) from their `admins` row.

export const getMyProfile = query({
  args: {},
  returns: v.object({
    tokenIdentifier: v.string(),
    email: v.union(v.string(), v.null()),
    name: v.union(v.string(), v.null()),
    role: v.union(v.literal("superadmin"), v.literal("admin")),
    adminSince: v.number(),
    // Inviter's resolved email, the "bootstrap" sentinel (client translates), or null.
    addedBy: v.union(v.string(), v.null()),
    note: v.union(v.string(), v.null()),
    lastSignInAt: v.union(v.string(), v.null()),
    accountCreatedAt: v.union(v.string(), v.null()),
    avatarUrl: v.union(v.string(), v.null()),
    hasCustomAvatar: v.boolean(), // uploaded here (removable) vs SSO photo
  }),
  handler: async (ctx) => {
    const me = await requireAdmin(ctx)
    const profile = await resolveProfile(ctx, me.tokenIdentifier)

    // "admin:<tokenIdentifier>" → that admin's email; the env-var bootstrap row
    // gets a sentinel the client renders as a translated label.
    let addedBy: string | null = me.row.addedBy ?? null
    if (addedBy?.startsWith("admin:")) {
      const inviter = await resolveProfile(ctx, addedBy.slice("admin:".length))
      addedBy = inviter?.email ?? `…${subjectOf(addedBy)}`
    } else if (addedBy?.startsWith("bootstrap:")) {
      addedBy = "bootstrap"
    }

    // Self-uploaded avatar wins; the SSO profile picture (Google/Apple) is the
    // fallback for accounts that never uploaded one.
    const uploadedUrl =
      me.row.avatarStorageId !== undefined
        ? await ctx.storage.getUrl(me.row.avatarStorageId)
        : null

    return {
      tokenIdentifier: me.tokenIdentifier,
      email: profile?.email ?? me.row.email ?? null,
      name: profile?.name ?? null,
      role: me.role,
      adminSince: me.row._creationTime,
      addedBy,
      note: me.row.note ?? null,
      lastSignInAt: profile?.lastSignInAt ?? null,
      accountCreatedAt: profile?.createdAt ?? null,
      avatarUrl: uploadedUrl ?? profile?.profilePictureUrl ?? null,
      hasCustomAvatar: uploadedUrl !== null,
    }
  },
})

// ---- Avatar (Convex file storage; WorkOS has no upload API) -------------------

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export const generateAvatarUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/** Point the own admins row at a freshly uploaded image. Validates the upload
 *  server-side (type/size) and deletes both rejects and the replaced file. */
export const setMyAvatar = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)

    const meta = await ctx.db.system.get(args.storageId)
    if (
      meta === null ||
      meta.size > MAX_AVATAR_BYTES ||
      !(meta.contentType ?? "").startsWith("image/")
    ) {
      if (meta !== null) await ctx.storage.delete(args.storageId)
      throw new ConvexError("INVALID_FILE")
    }

    if (me.row.avatarStorageId !== undefined) {
      await ctx.storage.delete(me.row.avatarStorageId)
    }
    await ctx.db.patch(me.row._id, { avatarStorageId: args.storageId })
    await logAdminAction(ctx, {
      ownerId: me.tokenIdentifier,
      actor: `admin:${me.tokenIdentifier}`,
      event: "account_updated",
      meta: { field: "avatar" },
    })
    return null
  },
})

/** Remove the uploaded avatar (falls back to the SSO photo / initials). */
export const removeMyAvatar = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const me = await requireAdmin(ctx)
    if (me.row.avatarStorageId === undefined) return null
    await ctx.storage.delete(me.row.avatarStorageId)
    await ctx.db.patch(me.row._id, { avatarStorageId: undefined })
    await logAdminAction(ctx, {
      ownerId: me.tokenIdentifier,
      actor: `admin:${me.tokenIdentifier}`,
      event: "account_updated",
      meta: { field: "avatar" },
    })
    return null
  },
})

/** Audit writer for self-service updates; on an email change it also keeps the
 *  own `admins` row's email in sync (it backs listAdmins + invite dedup). */
export const recordMyProfileUpdate = internalMutation({
  args: {
    ownerId: v.string(),
    fields: v.string(), // audit meta: "name" | "name,email"
    email: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.email !== undefined) {
      const row = await ctx.db
        .query("admins")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.ownerId))
        .unique()
      if (row !== null) await ctx.db.patch(row._id, { email: args.email })
    }
    await logAdminAction(ctx, {
      ownerId: args.ownerId,
      actor: `admin:${args.ownerId}`,
      event: "account_updated",
      meta: { field: args.fields },
    })
    return null
  },
})

/** Update the signed-in admin's OWN name and sign-in email (WorkOS profile).
 *  An email change may have to be re-verified on the next sign-in. */
export const updateMyProfile = action({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.admin.access.getAdminInternal, {})
    if (admin === null) throw new ConvexError("NOT_AUTHORIZED")
    const me = await ctx.auth.getUserIdentity()
    if (me === null) throw new ConvexError("NOT_AUTHORIZED")

    const email = args.email.trim().toLowerCase()
    if (!email.includes("@")) throw new ConvexError("INVALID_EMAIL")
    const userId = subjectOf(me.tokenIdentifier)

    let current
    try {
      current = await authKit.workos.userManagement.getUser(userId)
    } catch {
      throw new ConvexError("ACCOUNT_FAILED")
    }
    const emailChanged = email !== current.email.toLowerCase()
    if (emailChanged) {
      const existing = await authKit.workos.userManagement.listUsers({ email })
      if (existing.data.length > 0) throw new ConvexError("EMAIL_IN_USE")
    }

    try {
      await authKit.workos.userManagement.updateUser({
        userId,
        firstName: args.firstName.trim(),
        lastName: args.lastName?.trim() ?? "",
        ...(emailChanged ? { email } : {}),
      })
    } catch {
      // Never surface (or log) raw WorkOS errors.
      throw new ConvexError("ACCOUNT_FAILED")
    }
    await ctx.runMutation(internal.admin.profile.recordMyProfileUpdate, {
      ownerId: me.tokenIdentifier,
      fields: emailChanged ? "name,email" : "name",
      ...(emailChanged ? { email } : {}),
    })
    return null
  },
})
