import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { type Id } from "./_generated/dataModel"
import { assertEntitled } from "./lib/entitlements"
import { getEnabledUser, requireEnabledUser } from "./lib/account"

// Mirrors the `encrypted` column validator in schema.ts / vault.ts — base64
// AES-GCM ciphertext + the 12-byte IV it was sealed with. Stored opaquely.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

/** Delete every beneficiary key-wrap for an asset (batched — queries can't
 *  `.delete()`). Used on asset delete and on DEK rotation, where existing wraps
 *  encrypt a now-stale DEK. */
async function clearWrappedKeys(ctx: MutationCtx, assetId: Id<"assets">) {
  let batch = await ctx.db
    .query("wrappedKeys")
    .withIndex("by_assetId", (q) => q.eq("assetId", assetId))
    .take(100)
  while (batch.length > 0) {
    for (const wk of batch) await ctx.db.delete(wk._id)
    batch = await ctx.db
      .query("wrappedKeys")
      .withIndex("by_assetId", (q) => q.eq("assetId", assetId))
      .take(100)
  }
}

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
    const identity = await getEnabledUser(ctx)
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
    const identity = await getEnabledUser(ctx)
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
    const identity = await requireEnabledUser(ctx)
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
    const identity = await requireEnabledUser(ctx)
    const ownerId = identity.tokenIdentifier
    // Trial/paid gate: creating an asset is blocked once the trial lapses (read-only vault).
    await assertEntitled(ctx, ownerId)
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
    const identity = await requireEnabledUser(ctx)
    const ownerId = identity.tokenIdentifier
    // Trial/paid gate: editing is blocked once the trial lapses (read-only vault).
    await assertEntitled(ctx, ownerId)
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
    // A changed ownerWrappedKey means the DEK rotated (file replace → fresh DEK).
    // Existing beneficiary wraps now encrypt a stale DEK, so drop them; the client
    // reconciliation pass re-wraps the new DEK. A payload-only edit reuses the DEK
    // (same ownerWrappedKey), so the wraps stay valid and are untouched.
    if (row.ownerWrappedKey !== args.ownerWrappedKey) {
      await clearWrappedKeys(ctx, args.assetId)
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
    const identity = await requireEnabledUser(ctx)
    const ownerId = identity.tokenIdentifier
    const row = await ctx.db.get(args.assetId)
    if (row === null || row.ownerId !== ownerId) {
      throw new Error("Asset not found")
    }
    // Remove any per-beneficiary DEK copies so they don't outlive the asset.
    await clearWrappedKeys(ctx, args.assetId)
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
