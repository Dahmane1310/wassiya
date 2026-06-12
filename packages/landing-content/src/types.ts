// Shared shape for the landing copy, so `en` and `ar` stay in lock-step and
// section components can type their props against a single `Dict`.
export interface Stat {
  n: string
  l: string
}
export interface Step {
  t: string
  d: string
}
export interface IconStep {
  t: string
  d: string
  icon: string
}
export interface Tier {
  id: string
  name: string
  price: string
  period: string
  feats: string[]
  cta: string
  hl: boolean
  tag?: string
}
export interface Testimonial {
  q: string
  n: string
  r: string
}
export interface QA {
  q: string
  a: string
}
export interface FooterCol {
  h: string
  links: string[]
}

export interface Dict {
  dir: "ltr" | "rtl"
  nav: { how: string; security: string; sharia: string; pricing: string; faq: string; download: string }
  hero: {
    badge: string
    h1a: string
    h1b: string
    h1c: string
    sub: string
    trust: string
    slot: string
    cardTitle: string
    cardSub: string
  }
  marquee: string
  stats: Stat[]
  how: { kicker: string; title: string; sub: string; steps: Step[] }
  sharia: { kicker: string; title: string; sub: string; steps: IconStep[]; note: string; notesub: string }
  security: { kicker: string; title: string; sub: string; points: IconStep[] }
  sw: { kicker: string; title: string; sub: string; points: Step[]; armed: string; listening: string; due: string }
  features: { kicker: string; title: string; sub: string; items: IconStep[] }
  pricing: { kicker: string; title: string; sub: string; perMonth: string; tiers: Tier[] }
  testi: { kicker: string; title: string; items: Testimonial[] }
  faq: { kicker: string; title: string; items: QA[] }
  cta: { title: string; sub: string; trust: string }
  footer: { tagline: string; cols: FooterCol[]; rights: string }
  app: { store: string; appstore: string; geton: string; play: string }
}

export type Lang = "en" | "ar"
