import { ConvexError, v, type Infer } from "convex/values"
import {
  ICON_NAMES,
  LANDING_MANIFEST,
  type Dict,
} from "@workspace/landing-content"

// Convex validator mirroring @workspace/landing-content's `Dict`. The two-way
// type assertion at the bottom makes any drift between the two a COMPILE error.

const stat = v.object({ n: v.string(), l: v.string() })
const step = v.object({ t: v.string(), d: v.string() })
const iconStep = v.object({ t: v.string(), d: v.string(), icon: v.string() })
const tier = v.object({
  id: v.string(),
  name: v.string(),
  price: v.string(),
  period: v.string(),
  feats: v.array(v.string()),
  cta: v.string(),
  hl: v.boolean(),
  tag: v.optional(v.string()),
})
const testimonial = v.object({ q: v.string(), n: v.string(), r: v.string() })
const qa = v.object({ q: v.string(), a: v.string() })
const footerCol = v.object({ h: v.string(), links: v.array(v.string()) })

export const dictValidator = v.object({
  dir: v.union(v.literal("ltr"), v.literal("rtl")),
  nav: v.object({
    how: v.string(),
    security: v.string(),
    sharia: v.string(),
    pricing: v.string(),
    faq: v.string(),
    download: v.string(),
  }),
  hero: v.object({
    badge: v.string(),
    h1a: v.string(),
    h1b: v.string(),
    h1c: v.string(),
    sub: v.string(),
    trust: v.string(),
    slot: v.string(),
    cardTitle: v.string(),
    cardSub: v.string(),
  }),
  marquee: v.string(),
  stats: v.array(stat),
  how: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    steps: v.array(step),
  }),
  sharia: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    steps: v.array(iconStep),
    note: v.string(),
    notesub: v.string(),
  }),
  security: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    points: v.array(iconStep),
  }),
  sw: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    points: v.array(step),
    armed: v.string(),
    listening: v.string(),
    due: v.string(),
  }),
  features: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    items: v.array(iconStep),
  }),
  pricing: v.object({
    kicker: v.string(),
    title: v.string(),
    sub: v.string(),
    perMonth: v.string(),
    tiers: v.array(tier),
  }),
  testi: v.object({ kicker: v.string(), title: v.string(), items: v.array(testimonial) }),
  faq: v.object({ kicker: v.string(), title: v.string(), items: v.array(qa) }),
  cta: v.object({ title: v.string(), sub: v.string(), trust: v.string() }),
  footer: v.object({
    tagline: v.string(),
    cols: v.array(footerCol),
    rights: v.string(),
  }),
  app: v.object({
    store: v.string(),
    appstore: v.string(),
    geton: v.string(),
    play: v.string(),
  }),
})

// Two-way drift check: compiles only while validator ⇄ Dict stay identical.
type DictFromValidator = Infer<typeof dictValidator>
const _toDict = (x: DictFromValidator): Dict => x
const _fromDict = (x: Dict): DictFromValidator => x
void _toDict
void _fromDict

function getAt(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

/** Layout-level structure checks the type system can't express: array lengths
 *  the Astro components depend on, and icon names that exist in Icon.astro. */
export function validateStructure(data: Dict): void {
  const fail = (path: string): never => {
    throw new ConvexError(`INVALID_CONTENT:${path}`)
  }
  for (const section of LANDING_MANIFEST) {
    for (const field of section.fields) {
      if (field.kind !== "object-array") continue
      const arr = getAt(data, field.path)
      if (!Array.isArray(arr)) fail(field.path)
      const a = arr as unknown[]
      if (field.fixedLength !== undefined && a.length !== field.fixedLength) fail(field.path)
      if (field.min !== undefined && a.length < field.min) fail(field.path)
      if (field.max !== undefined && a.length > field.max) fail(field.path)
      for (const item of a) {
        for (const f of field.itemFields) {
          const value = (item as Record<string, unknown>)[f.key]
          if (f.kind === "icon") {
            if (
              typeof value !== "string" ||
              !(ICON_NAMES as readonly string[]).includes(value)
            ) {
              fail(`${field.path}.${f.key}`)
            }
          } else if (f.kind === "string-array") {
            if (!Array.isArray(value)) fail(`${field.path}.${f.key}`)
            const sa = value as unknown[]
            if (f.min !== undefined && sa.length < f.min) fail(`${field.path}.${f.key}`)
            if (f.max !== undefined && sa.length > f.max) fail(`${field.path}.${f.key}`)
          }
        }
      }
    }
  }
}
