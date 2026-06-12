// Schema-driven description of every editable field on the landing page. The
// admin editor renders forms from this, and the backend validates structure
// against it — neither hardcodes the content shape.
//
// `fixedLength` mirrors layout constraints baked into the Astro components
// (index-keyed icons/tints and fixed grid columns) — see each section's note.
// `dir`, `Tier.id` and `Tier.hl` are STRUCTURAL and deliberately absent: the
// editor must preserve them untouched.

/** Keys of the icon MAP in apps/landing/src/components/Icon.astro — keep in sync. */
export const ICON_NAMES = [
  "pulse",
  "apple",
  "arrowR",
  "check",
  "chevD",
  "doc",
  "fingerprint",
  "gift",
  "globe",
  "heart",
  "home",
  "key",
  "layers",
  "lock",
  "menu",
  "moon",
  "play",
  "quote",
  "scales",
  "scroll",
  "shield",
  "shieldCheck",
  "star",
  "sun",
  "users",
  "x",
] as const

export type IconName = (typeof ICON_NAMES)[number]

/** Admin-managed image slots. Each renders with a hard fallback in the
 *  components (WMark / placeholder / checked-in og PNG), so an empty slot can
 *  never break the site. `aspect` is the editor's preview hint; `sectionId`
 *  is the manifest section whose editor hosts the upload field. */
export const IMAGE_SLOTS = [
  { id: "logo", aspect: "1/1", sectionId: "nav" },
  { id: "heroPhoto", aspect: "4/5", sectionId: "hero" },
  { id: "ogImage", aspect: "1.91/1", sectionId: "footer" },
] as const

export type ImageSlotId = (typeof IMAGE_SLOTS)[number]["id"]

/** Slot → public URL, as served by the /landing-content endpoint. */
export type LandingImages = Partial<Record<ImageSlotId, string>>

export type ItemField = {
  key: string
  kind: "text" | "textarea" | "icon" | "string-array"
  /** Only for kind "string-array" items. */
  min?: number
  max?: number
}

export type FieldSpec =
  | { path: string; kind: "text" | "textarea" }
  | { path: string; kind: "object-array"; itemFields: ItemField[]; fixedLength?: number; min?: number; max?: number }

export type SectionSpec = { id: string; fields: FieldSpec[] }

const text = (path: string): FieldSpec => ({ path, kind: "text" })
const textarea = (path: string): FieldSpec => ({ path, kind: "textarea" })

export const LANDING_MANIFEST: SectionSpec[] = [
  {
    id: "nav",
    fields: ["how", "security", "sharia", "pricing", "faq", "download"].map((k) =>
      text(`nav.${k}`),
    ),
  },
  {
    id: "hero",
    fields: [
      text("hero.badge"),
      text("hero.h1a"),
      text("hero.h1b"),
      text("hero.h1c"),
      textarea("hero.sub"),
      text("hero.trust"),
      text("hero.slot"),
      text("hero.cardTitle"),
      text("hero.cardSub"),
      text("marquee"),
    ],
  },
  {
    id: "stats",
    fields: [
      {
        path: "stats",
        kind: "object-array",
        fixedLength: 4, // Stats.astro grid-cols-4
        itemFields: [
          { key: "n", kind: "text" },
          { key: "l", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "how",
    fields: [
      text("how.kicker"),
      text("how.title"),
      textarea("how.sub"),
      {
        path: "how.steps",
        kind: "object-array",
        fixedLength: 3, // HowItWorks.astro icons/tints are index-keyed (3 entries)
        itemFields: [
          { key: "t", kind: "text" },
          { key: "d", kind: "textarea" },
        ],
      },
    ],
  },
  {
    id: "sharia",
    fields: [
      text("sharia.kicker"),
      text("sharia.title"),
      textarea("sharia.sub"),
      {
        path: "sharia.steps",
        kind: "object-array",
        fixedLength: 3, // Sharia.astro tints are index-keyed (3 entries)
        itemFields: [
          { key: "t", kind: "text" },
          { key: "d", kind: "textarea" },
          { key: "icon", kind: "icon" },
        ],
      },
      textarea("sharia.note"),
      text("sharia.notesub"),
    ],
  },
  {
    id: "security",
    fields: [
      text("security.kicker"),
      text("security.title"),
      textarea("security.sub"),
      {
        path: "security.points",
        kind: "object-array",
        fixedLength: 4, // Security.astro hard-references points[1] + 2-col grid
        itemFields: [
          { key: "t", kind: "text" },
          { key: "d", kind: "textarea" },
          { key: "icon", kind: "icon" },
        ],
      },
    ],
  },
  {
    id: "sw",
    fields: [
      text("sw.kicker"),
      text("sw.title"),
      textarea("sw.sub"),
      {
        path: "sw.points",
        kind: "object-array",
        min: 1,
        max: 5, // vertical list — flexible
        itemFields: [
          { key: "t", kind: "text" },
          { key: "d", kind: "textarea" },
        ],
      },
      text("sw.armed"),
      text("sw.listening"),
      text("sw.due"),
    ],
  },
  {
    id: "features",
    fields: [
      text("features.kicker"),
      text("features.title"),
      textarea("features.sub"),
      {
        path: "features.items",
        kind: "object-array",
        min: 3,
        max: 9, // 3-col grid — keep multiples sensible, layout tolerates any count
        itemFields: [
          { key: "t", kind: "text" },
          { key: "d", kind: "textarea" },
          { key: "icon", kind: "icon" },
        ],
      },
    ],
  },
  {
    id: "pricing",
    fields: [
      text("pricing.kicker"),
      text("pricing.title"),
      textarea("pricing.sub"),
      {
        path: "pricing.tiers",
        kind: "object-array",
        fixedLength: 3, // Pricing.astro grid-cols-3; tier id/hl are structural
        itemFields: [
          { key: "name", kind: "text" },
          { key: "price", kind: "text" },
          { key: "period", kind: "text" },
          { key: "feats", kind: "string-array", min: 1, max: 8 },
          { key: "cta", kind: "text" },
          { key: "tag", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "testi",
    fields: [
      text("testi.kicker"),
      text("testi.title"),
      {
        path: "testi.items",
        kind: "object-array",
        min: 1,
        max: 6,
        itemFields: [
          { key: "q", kind: "textarea" },
          { key: "n", kind: "text" },
          { key: "r", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "faq",
    fields: [
      text("faq.kicker"),
      text("faq.title"),
      {
        path: "faq.items",
        kind: "object-array",
        min: 1,
        max: 10,
        itemFields: [
          { key: "q", kind: "text" },
          { key: "a", kind: "textarea" },
        ],
      },
    ],
  },
  {
    id: "cta",
    fields: [
      text("cta.title"),
      textarea("cta.sub"),
      text("cta.trust"),
      text("app.store"),
      text("app.appstore"),
      text("app.geton"),
      text("app.play"),
    ],
  },
  {
    id: "footer",
    fields: [
      text("footer.tagline"),
      {
        path: "footer.cols",
        kind: "object-array",
        fixedLength: 3, // Footer.astro grid assumes 3 link columns
        itemFields: [
          { key: "h", kind: "text" },
          { key: "links", kind: "string-array", min: 1, max: 6 },
        ],
      },
      text("footer.rights"),
    ],
  },
]
