<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convex-backend -->
# Convex backend

This repo uses [Convex](https://convex.dev) as its backend, in `packages/backend/`.

When working on Convex code, **read `packages/backend/convex/_generated/ai/guidelines.md` first** — it contains rules that override what you may have learned about Convex from training data.

Convex's agent skills and the guidelines file are managed in `packages/backend/` via `npx convex ai-files`. Don't hand-edit the generated files there.
<!-- END:convex-backend -->

<!-- BEGIN:template-guide -->
# This monorepo (read me)

Turborepo + pnpm template that bootstraps full-stack apps. Knowledge here is durable; for concrete, changeable values (env, ports) follow the source of truth noted below rather than memorising.

## Stack map
- `apps/web` — Next.js app (Convex + WorkOS auth + shared UI).
- `apps/admin` — Next.js app, a near-mirror of `web`.
- `apps/landing` — Astro marketing site, **static**, reuses `@workspace/ui` tokens/components.
- `apps/mobile` — Expo (React Native) app (Convex + WorkOS PKCE auth).
- `packages/backend` — Convex deployment: schema, functions, `auth.config.ts`, WorkOS AuthKit component (`@workspace/backend`).
- `packages/ui` — shared shadcn / Tailwind v4 components for web (`@workspace/ui`).
- `packages/ui-native` — shared React Native Reusables (shadcn-for-RN) components, styled with Uniwind / Tailwind v4 (`@workspace/ui-native`); consumed by Expo apps. See its README: the styling-engine config lives in the consuming app, and it intentionally supersedes the `expo-tailwind-setup` skill for the mobile UI layer.
- `packages/eslint-config`, `packages/typescript-config` — shared config.

## Conventions
- Package names are `@workspace/*`; depend on them with `workspace:*`.
- Shared packages export **source** (no build step) via their `exports` field.
- Cross-package relative paths assume **same depth** — every app sits at `apps/*`, so a new app inherits the same `../../packages/...` paths.
- `.env.local` is gitignored; `.env.example` is committed (documents required vars).
- Next.js apps must list shared workspace packages in `transpilePackages` (`next.config.ts`).
- Add a shadcn component with `pnpm dlx shadcn@latest add <component> -c apps/<app>` — it lands in `@workspace/ui`.

## ⚠️ The #1 trap: three separate env stores
A WorkOS/Convex var can live in three unrelated places, and putting it in the wrong one fails **silently** (`getUserIdentity()` returns null while the client looks signed in):
1. **Convex deployment env** — where `convex/auth.config.ts` and component code read `process.env.*`. Separate from any `.env.local`; `convex dev` does **not** push `.env.local` into it. Set via the managed flow or `npx convex env set`; verify with `npx convex env list`.
2. **`packages/backend/.env.local`** — written by `convex dev` (deployment URL, managed WorkOS vars).
3. **each app's `.env.local`** — the app's own client/server vars.
See the **README "three env stores" table** for which var goes where — don't reproduce it from memory.

## Auth model (principle)
- **Web/admin**: hosted WorkOS AuthKit (`@workos-inc/authkit-nextjs`) bridged into Convex via `ConvexProviderWithAuth`.
- **Mobile**: WorkOS **PKCE** flow (secret-less — never embed `WORKOS_API_KEY` in the bundle); tokens in `expo-secure-store`.
- `auth.config.ts` runs **on the Convex deployment** and validates WorkOS JWTs from the shared environment, so every client authenticates against it unchanged.
- In functions, derive identity server-side with `ctx.auth.getUserIdentity()`; **never** trust a client-passed user id. The synced WorkOS profile is `authKit.getAuthUser(ctx)`.

## Ports & callbacks (procedure, not fixed values)
Each app's dev port is set in its own `package.json` (`next dev --port …`) or `astro.config.mjs` (`server.port`) — those scripts are the source of truth. An app that uses auth must register `http://localhost:<port>/callback` in `packages/backend/convex.json` (`authKit.dev.configure.redirectUris` + `corsOrigins`) and then **re-run `convex dev`** so WorkOS picks it up.

## Deeper procedures → skills
- Convex backend work: use the installed `convex` / `convex-setup-auth` skills + `packages/backend/convex/_generated/ai/guidelines.md`.
- Auth wiring, adding an app, Expo specifics, Astro specifics: see `.claude/skills/` (`auth-wiring`, `add-app`, `mobile-expo`, `astro-landing`).
<!-- END:template-guide -->
