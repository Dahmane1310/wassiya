import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Mirrors the `encrypted` column validator in schema.ts / vault.ts — base64
// AES-GCM ciphertext + the 12-byte IV it was sealed with. Stored opaquely.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

// The owner-scoped shape returned for one stored asset. We build explicit DTOs
// (never echo the raw Doc) and OMIT `ownerId` — the caller is always the owner.
// ZERO-KNOWLEDGE: every field here is ciphertext / IV / a wrapped key — the
// server can decrypt none of it.
const assetFields = {
  _id: v.id("assets"),
  _creationTime: v.number(),
  payload: encrypted,
  storageId: v.optional(v.id("_storage")),
  fileIv: v.optional(v.string()),
  ownerWrappedKey: v.string(),
  ownerWrapIv: v.string(),
}

/** The current owner's assets, newest first. Empty when unauthenticated. */
export const listAssets = query({
  args: {},
  returns: v.array(v.object(assetFields)),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return []
    }
    const rows = await ctx.db
      .query("assets")
      .withIndex("by_ownerId", (q) =>
        q.eq("ownerId", identity.tokenIdentifier),
      )
      .order("desc")
      .take(200)
    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      payload: row.payload,
      storageId: row.storageId,
      fileIv: row.fileIv,
      ownerWrappedKey: row.ownerWrappedKey,
      ownerWrapIv: row.ownerWrapIv,
    }))
  },
})

/**
 * One asset plus a fresh signed download URL for its encrypted file (if any).
 * Returns `null` for unauthenticated, not-found, AND not-owner alike — no
 * existence leak.
 */
export const getAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.union(
    v.null(),
    v.object({ ...assetFields, fileUrl: v.union(v.string(), v.null()) }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const row = await ctx.db.get(args.assetId)
    if (row === null || row.ownerId !== identity.tokenIdentifier) {
      return null
    }
    const fileUrl = row.storageId
      ? await ctx.storage.getUrl(row.storageId)
      : null
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      payload: row.payload,
      storageId: row.storageId,
      fileIv: row.fileIv,
      ownerWrappedKey: row.ownerWrappedKey,
      ownerWrapIv: row.ownerWrapIv,
      fileUrl,
    }
  },
})

/**
 * A short-lived URL the client POSTs the ENCRYPTED file blob to. The plaintext
 * never reaches the server — only AES-GCM ciphertext bytes are uploaded.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    return await ctx.storage.generateUploadUrl()
  },
})

/** Create an asset. `ownerId` is always derived server-side, never a client arg. */
export const createAsset = mutation({
  args: {
    payload: encrypted,
    ownerWrappedKey: v.string(),
    ownerWrapIv: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileIv: v.optional(v.string()),
  },
  returns: v.id("assets"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const assetId = await ctx.db.insert("assets", {
      ownerId,
      payload: args.payload,
      storageId: args.storageId,
      fileIv: args.fileIv,
      ownerWrappedKey: args.ownerWrappedKey,
      ownerWrapIv: args.ownerWrapIv,
    })
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: ownerId,
      event: "asset_created",
      targetTable: "assets",
      targetId: assetId,
    })
    return assetId
  },
})

/**
 * Patch an asset (ownership-checked). The backend is DEK-agnostic — it only
 * diffs storage ids: when the file is replaced (id differs) or removed
 * (`storageId` cleared to undefined), the prior blob is deleted so it can't be
 * orphaned. The client has already uploaded the new encrypted blob.
 */
export const updateAsset = mutation({
  args: {
    assetId: v.id("assets"),
    payload: encrypted,
    ownerWrappedKey: v.string(),
    ownerWrapIv: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileIv: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const row = await ctx.db.get(args.assetId)
    if (row === null || row.ownerId !== ownerId) {
      throw new Error("Asset not found")
    }
    const previousStorageId = row.storageId
    // Passing `undefined` for storageId/fileIv clears those fields (Convex patch
    // removes a field set to undefined).
    await ctx.db.patch(args.assetId, {
      payload: args.payload,
      ownerWrappedKey: args.ownerWrappedKey,
      ownerWrapIv: args.ownerWrapIv,
      storageId: args.storageId,
      fileIv: args.fileIv,
    })
    if (previousStorageId && previousStorageId !== args.storageId) {
      await ctx.storage.delete(previousStorageId)
    }
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: ownerId,
      event: "asset_updated",
      targetTable: "assets",
      targetId: args.assetId,
    })
    return null
  },
})

/** Delete an asset, its beneficiary key-wraps, and its encrypted file blob. */
export const deleteAsset = mutation({
  args: { assetId: v.id("assets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const ownerId = identity.tokenIdentifier
    const row = await ctx.db.get(args.assetId)
    if (row === null || row.ownerId !== ownerId) {
      throw new Error("Asset not found")
    }
    // Remove any per-beneficiary DEK copies (none yet this pass — keeps delete
    // total once beneficiaries land). Queries can't `.delete()`; batch-iterate.
    let wrapped = await ctx.db
      .query("wrappedKeys")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .take(100)
    while (wrapped.length > 0) {
      for (const wk of wrapped) {
        await ctx.db.delete(wk._id)
      }
      wrapped = await ctx.db
        .query("wrappedKeys")
        .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
        .take(100)
    }
    if (row.storageId) {
      await ctx.storage.delete(row.storageId)
    }
    await ctx.db.delete(args.assetId)
    await ctx.db.insert("auditLog", {
      ownerId,
      actor: ownerId,
      event: "asset_deleted",
      targetTable: "assets",
      targetId: args.assetId,
    })
    return null
  },
})
