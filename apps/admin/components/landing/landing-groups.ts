// Which manifest sections each Content-group page edits. Every section id in
// LANDING_MANIFEST must appear in exactly one group (media is images-only).
export const LANDING_GROUPS = {
  hero: ["nav", "hero", "stats"],
  sections: ["how", "sharia", "security", "sw", "features"],
  pricing: ["pricing", "testi", "faq"],
  footer: ["cta", "footer"],
} as const

export type LandingGroupId = keyof typeof LANDING_GROUPS
