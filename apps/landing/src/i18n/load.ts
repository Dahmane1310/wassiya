import {
  DEFAULT_DICTS,
  IMAGE_SLOTS,
  type Dict,
  type Lang,
  type LandingImages,
} from "@workspace/landing-content"

// Build-time content loader. When LANDING_CONTENT_URL points at the Convex
// deployment's /landing-content route, the PUBLISHED admin-managed copy and
// image URLs are fetched; the copy is deep-merged over the checked-in dict.
// On any failure (env unset, network down, nothing published yet) the build
// falls back to the checked-in copy — and components fall back to their
// built-in rendering for missing image slots. Runs only at `astro build`.

export type LandingData = { t: Dict; images: LandingImages }

/** Merge remote over local: objects per key, arrays/primitives wholesale,
 *  remote keys unknown to the local shape ignored. A missing remote key can
 *  therefore never break the build. */
function deepMerge<T>(local: T, remote: unknown): T {
  if (
    typeof local !== "object" ||
    local === null ||
    Array.isArray(local) ||
    typeof remote !== "object" ||
    remote === null ||
    Array.isArray(remote)
  ) {
    return remote === undefined ? local : (remote as T)
  }
  const out: Record<string, unknown> = { ...(local as Record<string, unknown>) }
  for (const key of Object.keys(local as Record<string, unknown>)) {
    const r = (remote as Record<string, unknown>)[key]
    if (r !== undefined) {
      out[key] = deepMerge((local as Record<string, unknown>)[key], r)
    }
  }
  return out as T
}

function pickImages(raw: unknown): LandingImages {
  if (typeof raw !== "object" || raw === null) return {}
  const out: LandingImages = {}
  for (const slot of IMAGE_SLOTS) {
    const url = (raw as Record<string, unknown>)[slot.id]
    if (typeof url === "string") out[slot.id] = url
  }
  return out
}

export async function loadLanding(lang: Lang): Promise<LandingData> {
  const fallback: LandingData = { t: DEFAULT_DICTS[lang], images: {} }
  const base = import.meta.env.LANDING_CONTENT_URL as string | undefined
  if (!base) {
    console.log(`[landing] ${lang}: using checked-in dict (LANDING_CONTENT_URL unset)`)
    return fallback
  }
  try {
    const res = await fetch(`${base}?lang=${lang}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn(`[landing] ${lang}: content endpoint returned ${res.status} — using checked-in dict`)
      return fallback
    }
    const body: unknown = await res.json()
    const remote = (body as { content?: unknown }).content
    // content is null for an images-only publish — keep the checked-in copy.
    const merged = remote == null ? fallback.t : deepMerge(fallback.t, remote)
    // `dir` is structural — always the local value, whatever the endpoint says.
    merged.dir = fallback.t.dir
    console.log(`[landing] ${lang}: using published content from ${base}`)
    return { t: merged, images: pickImages((body as { images?: unknown }).images) }
  } catch {
    console.warn(`[landing] ${lang}: content fetch failed — using checked-in dict`)
    return fallback
  }
}
