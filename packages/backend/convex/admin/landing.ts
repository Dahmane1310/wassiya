import { v } from "convex/values"
import { ConvexError } from "convex/values"
import { IMAGE_SLOTS, type Dict } from "@workspace/landing-content"
import { internal } from "../_generated/api"
import { type Doc, type Id } from "../_generated/dataModel"
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server"
import { logAdminAction, requireAdmin } from "../lib/adminAuth"
import { dictValidator, validateStructure } from "../lib/landingValidator"

// Landing-page content manager: draft → publish per language. The public
// /landing-content HTTP route (http.ts) serves the published channel to
// `astro build`; the checked-in dicts remain the landing's fallback.

const langValidator = v.union(v.literal("en"), v.literal("ar"))
type ContentLang = "en" | "ar"

async function getRow(
  ctx: QueryCtx,
  lang: ContentLang,
  channel: "draft" | "published",
): Promise<Doc<"landingContent"> | null> {
  return await ctx.db
    .query("landingContent")
    .withIndex("by_lang_and_channel", (q) => q.eq("lang", lang).eq("channel", channel))
    .unique()
}

const channelPair = v.object({
  draft: v.union(dictValidator, v.null()),
  published: v.union(dictValidator, v.null()),
  draftUpdatedAt: v.union(v.number(), v.null()),
  publishedAt: v.union(v.number(), v.null()),
  lastDeployAt: v.union(v.number(), v.null()),
  lastDeployOk: v.union(v.boolean(), v.null()),
  hasUnpublishedChanges: v.boolean(),
})

async function pairFor(ctx: QueryCtx, lang: ContentLang) {
  const draft = await getRow(ctx, lang, "draft")
  const published = await getRow(ctx, lang, "published")
  const hasUnpublishedChanges =
    draft !== null &&
    (published === null || JSON.stringify(draft.data) !== JSON.stringify(published.data))
  return {
    draft: draft?.data ?? null,
    published: published?.data ?? null,
    draftUpdatedAt: draft?.updatedAt ?? null,
    publishedAt: published?.publishedAt ?? null,
    lastDeployAt: published?.lastDeployAt ?? null,
    lastDeployOk: published?.lastDeployOk ?? null,
    hasUnpublishedChanges,
  }
}

// ── Images (slot → storage file, language-agnostic) ─────────────────────────

const SLOT_IDS: readonly string[] = IMAGE_SLOTS.map((s) => s.id)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

async function getImagesRow(
  ctx: QueryCtx,
  channel: "draft" | "published",
): Promise<Doc<"landingImages"> | null> {
  return await ctx.db
    .query("landingImages")
    .withIndex("by_channel", (q) => q.eq("channel", channel))
    .unique()
}

async function slotUrls(
  ctx: QueryCtx,
  row: Doc<"landingImages"> | null,
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  for (const slot of SLOT_IDS) {
    const id = row?.slots[slot]
    out[slot] = id !== undefined ? await ctx.storage.getUrl(id) : null
  }
  return out
}

/** Delete a storage file unless some channel row still references it. */
async function deleteIfUnreferenced(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  for (const channel of ["draft", "published"] as const) {
    const row = await getImagesRow(ctx, channel)
    if (row !== null && Object.values(row.slots).includes(storageId)) return
  }
  await ctx.storage.delete(storageId)
}

async function upsertImagesRow(
  ctx: MutationCtx,
  channel: "draft" | "published",
  slots: Record<string, Id<"_storage">>,
  updatedBy: string,
): Promise<void> {
  const existing = await getImagesRow(ctx, channel)
  const fields = { slots, updatedBy, updatedAt: Date.now() }
  if (existing !== null) await ctx.db.patch(existing._id, fields)
  else await ctx.db.insert("landingImages", { channel, ...fields })
}

const imagesPair = v.object({
  draft: v.record(v.string(), v.union(v.string(), v.null())),
  published: v.record(v.string(), v.union(v.string(), v.null())),
  hasUnpublishedChanges: v.boolean(),
})

export const getLandingContent = query({
  args: {},
  returns: v.object({ en: channelPair, ar: channelPair, images: imagesPair }),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const draftRow = await getImagesRow(ctx, "draft")
    const publishedRow = await getImagesRow(ctx, "published")
    const images = {
      draft: await slotUrls(ctx, draftRow),
      published: await slotUrls(ctx, publishedRow),
      hasUnpublishedChanges:
        draftRow !== null &&
        JSON.stringify(draftRow.slots) !== JSON.stringify(publishedRow?.slots ?? {}),
    }
    return { en: await pairFor(ctx, "en"), ar: await pairFor(ctx, "ar"), images }
  },
})

export const generateImageUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/** Point a slot of the DRAFT channel at a freshly uploaded image. Validates
 *  the upload server-side; the replaced file is deleted once unreferenced. */
export const setLandingImage = mutation({
  args: { slot: v.string(), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    if (!SLOT_IDS.includes(args.slot)) throw new ConvexError("INVALID_SLOT")

    const meta = await ctx.db.system.get(args.storageId)
    if (
      meta === null ||
      meta.size > MAX_IMAGE_BYTES ||
      !(meta.contentType ?? "").startsWith("image/")
    ) {
      if (meta !== null) await ctx.storage.delete(args.storageId)
      throw new ConvexError("INVALID_FILE")
    }

    const draft = await getImagesRow(ctx, "draft")
    const previous = draft?.slots[args.slot]
    const slots = { ...(draft?.slots ?? {}), [args.slot]: args.storageId }
    await upsertImagesRow(ctx, "draft", slots, `admin:${me.tokenIdentifier}`)
    if (previous !== undefined && previous !== args.storageId) {
      await deleteIfUnreferenced(ctx, previous)
    }
    return null
  },
})

/** Clear a DRAFT slot (the site falls back to its built-in rendering). */
export const removeLandingImage = mutation({
  args: { slot: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    if (!SLOT_IDS.includes(args.slot)) throw new ConvexError("INVALID_SLOT")
    const draft = await getImagesRow(ctx, "draft")
    const previous = draft?.slots[args.slot]
    if (draft === null || previous === undefined) return null
    const slots = { ...draft.slots }
    delete slots[args.slot]
    await upsertImagesRow(ctx, "draft", slots, `admin:${me.tokenIdentifier}`)
    await deleteIfUnreferenced(ctx, previous)
    return null
  },
})

/** Upsert the draft for one language. No audit — saves are frequent and the
 *  meaningful event is the publish. */
export const saveDraft = mutation({
  args: { lang: langValidator, data: dictValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    // `dir` is structural — never trust the client's value.
    const data: Dict = { ...args.data, dir: args.lang === "ar" ? "rtl" : "ltr" }
    validateStructure(data)

    const existing = await getRow(ctx, args.lang, "draft")
    const fields = {
      data,
      updatedBy: `admin:${me.tokenIdentifier}`,
      updatedAt: Date.now(),
    }
    if (existing !== null) await ctx.db.patch(existing._id, fields)
    else await ctx.db.insert("landingContent", { lang: args.lang, channel: "draft", ...fields })
    return null
  },
})

/** Copy every language's draft to its published channel, audit once, then
 *  kick the (optional) deploy hook so the static site rebuilds. */
export const publishDrafts = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const me = await requireAdmin(ctx)
    const now = Date.now()
    const publishedLangs: string[] = []

    for (const lang of ["en", "ar"] as const) {
      const draft = await getRow(ctx, lang, "draft")
      if (draft === null) continue
      const fields = {
        data: draft.data,
        updatedBy: `admin:${me.tokenIdentifier}`,
        updatedAt: now,
        publishedAt: now,
      }
      const published = await getRow(ctx, lang, "published")
      if (published !== null) await ctx.db.patch(published._id, fields)
      else
        await ctx.db.insert("landingContent", { lang, channel: "published", ...fields })
      publishedLangs.push(lang)
    }

    // Images: copy the draft slot map to published; files replaced out of the
    // published map are deleted once nothing references them.
    const imagesDraft = await getImagesRow(ctx, "draft")
    let imagesPublished = false
    if (imagesDraft !== null) {
      const prevPublished = await getImagesRow(ctx, "published")
      const replaced = Object.values(prevPublished?.slots ?? {}).filter(
        (id) => !Object.values(imagesDraft.slots).includes(id),
      )
      await upsertImagesRow(
        ctx,
        "published",
        imagesDraft.slots,
        `admin:${me.tokenIdentifier}`,
      )
      for (const id of replaced) await deleteIfUnreferenced(ctx, id)
      imagesPublished = true
    }
    if (publishedLangs.length === 0 && !imagesPublished) throw new ConvexError("NO_DRAFT")

    await logAdminAction(ctx, {
      ownerId: "landing",
      actor: `admin:${me.tokenIdentifier}`,
      event: "landing_published",
      targetTable: "landingContent",
      meta: { langs: publishedLangs.join(",") || "images-only" },
    })
    await ctx.scheduler.runAfter(0, internal.admin.landing.triggerDeploy, {})
    return null
  },
})

export const discardDraft = mutation({
  args: { lang: langValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx)
    const draft = await getRow(ctx, args.lang, "draft")
    if (draft === null) return null
    await ctx.db.delete(draft._id)
    await logAdminAction(ctx, {
      ownerId: "landing",
      actor: `admin:${me.tokenIdentifier}`,
      event: "landing_draft_discarded",
      targetTable: "landingContent",
      meta: { lang: args.lang },
    })
    return null
  },
})

/** POST the deploy hook (Vercel/Cloudflare/…) so the static landing rebuilds
 *  with the freshly published content. Silent no-op until the env var is set —
 *  same convention as the Resend config in notificationSender.ts. */
export const triggerDeploy = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Panel-managed settings win over the deployment env (integrationSettings.ts).
    const settings = await ctx.runQuery(internal.integrationSettings.getAllInternal, {})
    const url = settings.LANDING_DEPLOY_HOOK_URL
    if (!url) {
      console.log("landing: LANDING_DEPLOY_HOOK_URL not set — skipping rebuild trigger")
      return null
    }
    let ok = false
    try {
      const res = await fetch(url, { method: "POST" })
      ok = res.ok
    } catch {
      ok = false
    }
    await ctx.runMutation(internal.admin.landing.recordDeployResult, { ok })
    return null
  },
})

export const recordDeployResult = internalMutation({
  args: { ok: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const lang of ["en", "ar"] as const) {
      const published = await getRow(ctx, lang, "published")
      if (published !== null) {
        await ctx.db.patch(published._id, {
          lastDeployAt: Date.now(),
          lastDeployOk: args.ok,
        })
      }
    }
    return null
  },
})

/** Published content for the public HTTP route (http.ts). */
export const getPublished = internalQuery({
  args: { lang: langValidator },
  returns: v.union(dictValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await getRow(ctx, args.lang, "published")
    return row?.data ?? null
  },
})

/** Published image URLs (set slots only) for the public HTTP route. */
export const getPublishedImages = internalQuery({
  args: {},
  returns: v.record(v.string(), v.string()),
  handler: async (ctx) => {
    const row = await getImagesRow(ctx, "published")
    const out: Record<string, string> = {}
    if (row === null) return out
    for (const [slot, id] of Object.entries(row.slots)) {
      const url = await ctx.storage.getUrl(id)
      if (url !== null) out[slot] = url
    }
    return out
  },
})
