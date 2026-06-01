---
name: astro-landing
description: >-
  Work in the Astro marketing site at apps/landing. Use when editing the landing
  page, adding sections/components, using shadcn/@workspace/ui in Astro, touching
  Tailwind v4 styling there, or adding dynamic data to the landing. Captures the
  zero-JS model, the Tailwind @source fix for .astro files, and the Convex
  pattern for static sites.
---

# Landing (Astro)

`apps/landing` is a **static** Astro site that reuses `@workspace/ui` (shadcn / Tailwind v4) to stay on-brand, with ~zero client JS.

## When to use
- Any change under `apps/landing`: sections, components, styling, or adding dynamic data.

## When NOT to use
- The Next.js apps or mobile — different runtimes.

## Zero-JS model
- Astro renders React components to **static HTML at build time by default**. Using a shadcn component (`<Button>`, `<Card>`, `<Badge>`) presentationally ships **no client JS**.
- JS is only shipped if you add a `client:*` directive (`client:load`, `client:visible`). Use it **only** for genuinely interactive pieces, and keep that interactive group in a **single `.tsx` island** — React context is not shared across separate Astro islands.
- For links styled as buttons, prefer `<a class={buttonVariants(...)}>` over a hydrated button.

## Tailwind v4 + shared tokens (the load-bearing fix)
- Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs` (the old `@astrojs/tailwind` integration is deprecated).
- `src/styles/global.css` imports the shared theme and **adds an Astro content source**:
  ```css
  @import "@workspace/ui/globals.css";
  @source "./**/*.{astro,ts,tsx}";
  ```
  The shared `globals.css` only scans `.ts/.tsx`, so **without the added `@source`, utility classes written in `.astro` markup are never generated** (they silently don't apply).
- **CSS-comment trap:** a CSS comment that contains a `**/` glob (e.g. describing `apps/**/*`) closes the comment early (`*/`), corrupting the next rule. Keep globs out of comments.

## Dynamic data (when needed)
- The landing has no React provider and no WorkOS auth. For a form/dynamic call, use an Astro **server endpoint** with `ConvexHttpClient` from `convex/browser` for a one-shot mutation/query — not `ConvexReactClient`/`ConvexProviderWithAuth`.

## Gotchas
- Importing the full `@workspace/ui/globals.css` pulls in extra theme vars/animations — fine (Tailwind tree-shakes unused utilities).
- No `next-themes` here, so the landing is **light-only** unless you add a small inline `.dark` toggle script.
- `next/font` isn't available — use `@fontsource/*` or a `<link>` for exact font parity.

## Verify
- `pnpm --filter landing build` → static `dist/`; `index.html` has **no `<script>` tags** for pages without `client:*`.
- A class used only in `.astro` (e.g. `bg-primary`) appears in the built CSS (the `@source` fix works).
- `pnpm --filter landing typecheck` (`astro check`) passes.
