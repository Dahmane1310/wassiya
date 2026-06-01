---
name: add-app
description: >-
  Scaffold a new app in this Turborepo + pnpm monorepo (a Next.js app like
  web/admin, an Astro site, or an Expo app). Use when the user says "add an
  app", "new admin/marketing/dashboard app", or wants another deployable under
  apps/. Covers naming, port allocation, env files, transpilePackages, WorkOS
  callback registration, and turbo wiring.
---

# Add an app to the monorepo

Fastest reliable path: **mirror an existing app of the same type**, then change only what's app-specific. `pnpm-workspace.yaml` already globs `apps/*`, so a new folder is picked up automatically.

## When to use
- Creating any new app under `apps/` (Next.js, Astro, Expo).

## When NOT to use
- A shared library → that's a `packages/*`, not an app (still `@workspace/*`, but no app wiring/port).

## Steps
1. **Pick the closest existing app** and copy its **git-tracked** files (skips `node_modules`/`.next`/`dist`/`.env.local`):
   ```sh
   for f in $(git ls-files apps/<source>); do
     dest="apps/<new>/${f#apps/<source>/}"; mkdir -p "$(dirname "$dest")"; cp "$f" "$dest"
   done
   ```
   (Next.js → mirror `web`; Astro → mirror `landing`; Expo → mirror `mobile`.)
2. **Rename the package** in `apps/<new>/package.json` (`"name": "<new>"`).
3. **Allocate a free dev port** (check existing apps' dev scripts first; don't collide):
   - Next.js: `"dev": "next dev --port <port>"`, `"start": "next start --port <port>"`.
   - Astro: `server: { port: <port> }` in `astro.config.mjs`.
   - Expo: no fixed web port; it runs on a device/emulator.
4. **Env files.** Edit the copied `.env.example` for the new app; create `.env.local` (gitignored) with real values. For a new redirect URI, set `…/callback` for the new port/scheme.
5. **If the app uses auth**, follow the `auth-wiring` skill: register `http://localhost:<port>/callback` (or the mobile scheme) in `packages/backend/convex.json` (`redirectUris` + `corsOrigins`) and **re-run `convex dev`**.
6. **Next.js only:** confirm `transpilePackages` in `next.config.ts` lists the shared packages it imports (`@workspace/ui`, `@workspace/backend`).
7. **New build output dir?** Add it to `turbo.json` `build.outputs` (e.g. Astro → `dist/**`; Next `.next/**` is already there).
8. `pnpm install`, then `pnpm --filter <new> typecheck`.

## Gotchas
- Copying with `cp -r` drags in `node_modules` (broken pnpm symlinks) and `.env.local` — use the `git ls-files` loop instead.
- Cross-package relative paths (tsconfig `paths`, `components.json` css path) work unchanged **only** because apps sit at the same depth (`apps/*`).
- `.env.local` is gitignored, so it isn't copied — recreate it (and the mirror's secrets, e.g. a fresh `WORKOS_COOKIE_PASSWORD`).
- On Windows, a running `turbo dev`/Metro can lock files during copy/rename — stop it first.

## Verify
- `pnpm install` links the app; `pnpm --filter <new> typecheck` passes.
- `pnpm --filter <new> dev` serves on the chosen port without colliding.
- If auth: sign-in round-trips (see `auth-wiring` verify).
