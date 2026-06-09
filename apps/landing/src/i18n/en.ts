// English copy for the landing page. Ported verbatim from the approved
// Claude Design mockup (Wassiya Landing.html → translation dictionary `T.en`).
import type { Dict } from "./types"

export const en: Dict = {
  dir: "ltr",
  nav: {
    how: "How it works",
    security: "Security",
    sharia: "Sharia",
    pricing: "Pricing",
    faq: "FAQ",
    download: "Download app",
  },
  hero: {
    badge: "Zero-knowledge legacy vault",
    h1a: "Your legacy,",
    h1b: "kept safe until",
    h1c: "it’s needed.",
    sub: "Wassiya is an encrypted vault for your entire estate — quietly held during your life, then released to your loved ones by Islamic law, exactly when the time comes.",
    trust: "End-to-end encrypted · Sharia-certified · Built for the Gulf",
    slot: "Drop a warm family / Gulf lifestyle photo",
    cardTitle: "Vault armed",
    cardSub: "Listening for your heartbeat",
  },
  marquee: "TRUSTED FOUNDATIONS",
  stats: [
    { n: "AES-256", l: "end-to-end encryption" },
    { n: "Zero", l: "knowledge — we can’t read it" },
    { n: "100%", l: "Fara’id-compliant by design" },
    { n: "⅓", l: "Wasiyyah cap, enforced" },
  ],
  how: {
    kicker: "How it works",
    title: "Three quiet steps",
    sub: "Set it up once. Wassiya does the watching.",
    steps: [
      {
        t: "Fill your vault",
        d: "Add property, accounts, crypto, documents and final wishes. Everything is encrypted on your device before it ever leaves.",
      },
      {
        t: "Check in to stay armed",
        d: "A gentle heartbeat. Confirm you’re here on your own schedule — miss it, and a grace period begins before anything moves.",
      },
      {
        t: "Released by Islamic law",
        d: "Debts first, then your one-third bequest, then automatic Fara’id shares — delivered to your heirs, encrypted to them alone.",
      },
    ],
  },
  sharia: {
    kicker: "Sharia & Fara’id",
    title: "Inheritance, done right.",
    sub: "Wassiya follows the Quranic order of distribution — automatically, and exactly.",
    steps: [
      {
        t: "Debts & funeral",
        d: "Settled first, before any share is calculated.",
        icon: "scales",
      },
      {
        t: "Wasiyyah — your bequest",
        d: "Freely will up to one-third to charity or non-heirs. The cap is enforced.",
        icon: "scroll",
      },
      {
        t: "Fara’id — fixed shares",
        d: "The remaining estate flows to heirs by their Quranic fractions.",
        icon: "users",
      },
    ],
    note: "“Bequeath one-third, and one-third is plenty.”",
    notesub: "Reviewed and certified against GCC inheritance law.",
  },
  security: {
    kicker: "Security",
    title: "Trust is the product.",
    sub: "We built Wassiya so that even we can never read what’s inside.",
    points: [
      {
        t: "Zero-knowledge by design",
        d: "Your master key is derived from a passphrase only you hold. We store ciphertext and nothing else.",
        icon: "shieldCheck",
      },
      {
        t: "Encrypted on your device",
        d: "AES-256-GCM happens locally, before anything reaches our servers.",
        icon: "lock",
      },
      {
        t: "Keys wrapped per heir",
        d: "Each beneficiary gets their own wrapped key, verified by fingerprint.",
        icon: "key",
      },
      {
        t: "Biometric unlock",
        d: "Face ID and Touch ID on your trusted devices, recovery kit for everything else.",
        icon: "fingerprint",
      },
    ],
  },
  sw: {
    kicker: "The dead-man’s switch",
    title: "It listens, so you don’t have to worry.",
    sub: "A simple, humane check-in keeps your vault sealed — and opens it only when it truly must.",
    points: [
      { t: "You check in", d: "On a 30, 60 or 90-day cadence that suits your life." },
      {
        t: "Grace, not surprise",
        d: "Miss a check-in and a 14-day grace period begins, with reminders to you and your executors.",
      },
      { t: "Verified release", d: "An executor confirms; only then is your legacy unsealed." },
    ],
    armed: "Dead-man’s switch · armed",
    listening: "Your vault is listening",
    due: "Next check-in in 27 days",
  },
  features: {
    kicker: "Everything in one vault",
    title: "Built for a whole life’s worth.",
    sub: "",
    items: [
      {
        t: "Real estate & deeds",
        d: "Title deeds, addresses, and the safe-drawer they live in.",
        icon: "home",
      },
      {
        t: "Accounts & crypto",
        d: "IBANs, brokerages, and cold-wallet seed phrases — sealed.",
        icon: "layers",
      },
      {
        t: "Heirs & family tree",
        d: "Map your family; watch Fara’id shares compute live.",
        icon: "users",
      },
      {
        t: "Documents & files",
        d: "Wills, policies, passwords — encrypted on upload.",
        icon: "doc",
      },
      { t: "Executors", d: "Name the people you trust to carry it through.", icon: "shield" },
      {
        t: "Bequests & gifts",
        d: "Charity and non-heirs, kept within the permitted third.",
        icon: "gift",
      },
    ],
  },
  pricing: {
    kicker: "Pricing",
    title: "One vault. Your pace.",
    sub: "Start free. Upgrade when you’re ready. Lifetime means never again.",
    perMonth: "",
    tiers: [
      {
        id: "trial",
        name: "Trial",
        price: "Free",
        period: "for 14 days",
        feats: ["Full vault access", "Up to 3 assets", "1 beneficiary"],
        cta: "Start free",
        hl: false,
      },
      {
        id: "annual",
        name: "Annual",
        price: "AED 499",
        period: "/ year",
        feats: [
          "Unlimited assets & heirs",
          "All beneficiaries",
          "Annual Sharia review",
          "Priority support",
        ],
        cta: "Choose Annual",
        hl: true,
        tag: "Most popular",
      },
      {
        id: "lifetime",
        name: "Lifetime",
        price: "AED 2,900",
        period: "one-time",
        feats: ["Everything in Annual", "No renewals, ever", "Founder badge", "Concierge setup"],
        cta: "Go Lifetime",
        hl: false,
      },
    ],
  },
  testi: {
    kicker: "Trusted by families",
    title: "Peace of mind, in their words.",
    items: [
      {
        q: "I finally sleep knowing my family won’t be lost in paperwork. Everything is in one place, and it’s ours alone.",
        n: "Khalid A.",
        r: "Father of four · Dubai",
      },
      {
        q: "The Fara’id calculation is exactly what my lawyer confirmed — but I set it up in an evening.",
        n: "Mariam S.",
        r: "Business owner · Abu Dhabi",
      },
      {
        q: "Knowing not even Wassiya can read it is the whole reason I trust it.",
        n: "Yusuf R.",
        r: "Investor · Sharjah",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    title: "Everything you might ask.",
    items: [
      {
        q: "Can Wassiya read my data?",
        a: "No. Everything is encrypted on your device with a key derived from your passphrase. We only ever store ciphertext — it is mathematically impossible for us to read your vault.",
      },
      {
        q: "What happens if I forget my passphrase?",
        a: "Your printed Recovery Kit is the only way back. We cannot reset it for you — that’s the cost, and the proof, of true zero-knowledge security.",
      },
      {
        q: "How does the dead-man’s switch work?",
        a: "You check in on a cadence you choose. If you miss one, a 14-day grace period begins with reminders. Only after grace expires — and an executor confirms — is release authorized.",
      },
      {
        q: "Is the distribution really Sharia-compliant?",
        a: "Yes. Debts are settled first, your Wasiyyah is capped at one-third, and the remainder is distributed by Fara’id fractions. It’s reviewed against GCC inheritance law.",
      },
      {
        q: "Who can see my legacy after release?",
        a: "Only the beneficiaries you named, each with their own key. Files are decrypted in their browser — never on our servers.",
      },
    ],
  },
  cta: {
    title: "Give your family the gift of certainty.",
    sub: "Download Wassiya and seal your legacy in an evening.",
    trust: "Free to start · No card required",
  },
  footer: {
    tagline: "Legacy, kept safe.",
    cols: [
      { h: "Product", links: ["How it works", "Security", "Pricing", "Download"] },
      { h: "Company", links: ["About", "Sharia board", "Careers", "Contact"] },
      { h: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
    ],
    rights: "© 2026 Wassiya. Encrypted on-device. Built for the Gulf.",
  },
  app: { store: "Download on the", appstore: "App Store", geton: "GET IT ON", play: "Google Play" },
}
