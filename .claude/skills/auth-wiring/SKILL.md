---
name: auth-wiring
description: >-
  Wire or debug WorkOS AuthKit + Convex authentication in this monorepo. Use
  when adding or changing auth, sign-in/sign-out, protected Convex functions,
  redirect URIs, the WorkOS webhook, or when "the client is signed in but Convex
  sees no user" (getUserIdentity returns null). Covers web (Next.js) and mobile
  (Expo) auth.
---

# Auth wiring (WorkOS AuthKit + Convex)

Authentication spans **three separate env stores** and a few non-obvious steps. Most "auth is broken" issues are an env var in the wrong store or an unregistered redirect URI — not code.

## When to use
- Adding/changing auth in any app, or adding a protected Convex function.
- A new app needs sign-in; a redirect URI changed; the webhook isn't syncing users.
- Symptom: client looks authenticated but `ctx.auth.getUserIdentity()` is `null`.

## When NOT to use
- Pure Convex data modeling with no auth → use the `convex` / `convex-setup-auth` skills + `packages/backend/convex/_generated/ai/guidelines.md`.

## The mental model
- `convex/auth.config.ts` runs **on the Convex deployment** and validates WorkOS JWTs. The deployment env is a **separate store** from any `.env.local`; `convex dev` does NOT copy `.env.local` into it.
- Same WorkOS environment issues tokens for web and mobile, so the backend validates both unchanged.
- Three stores (see root `AGENTS.md` + the README table):
  1. Convex **deployment** env — `auth.config.ts` / component read these. Set via managed flow or `npx convex env set`; check `npx convex env list`.
  2. `packages/backend/.env.local` — written by `convex dev`.
  3. each app's `.env.local`.

## Steps
1. **Backend is already auth-ready** (`auth.config.ts`, `convex.config.ts` with the `@convex-dev/workos-authkit` component, `http.ts`). Don't re-scaffold it; reuse it.
2. **Register the app's callback.** Add `http://localhost:<port>/callback` (web/admin) or the app scheme `…://callback` (mobile) to `packages/backend/convex.json` → `authKit.dev.configure.redirectUris` (+ `corsOrigins` for web). **Re-run `convex dev`** to push it to WorkOS — config in `convex.json` only reaches WorkOS on a dev run.
3. **Webhook secret (chicken-and-egg).** `convex/http.ts` registers the AuthKit webhook, which reads `WORKOS_WEBHOOK_SECRET` at module-analysis time — the **first push fails** without it. Create the webhook in the WorkOS dashboard (`https://<deployment>.convex.site/workos/webhook`, events `user.created|updated|deleted`), then `npx convex env set WORKOS_WEBHOOK_SECRET <secret>`. To unblock the push first, set any placeholder.
4. **App env.** Copy `.env.example` → `.env.local` and fill it. **Mirror** `WORKOS_CLIENT_ID` / `WORKOS_API_KEY` from `packages/backend/.env.local` into web/admin (`convex.json` `localEnvVars` only writes the backend file). Generate `WORKOS_COOKIE_PASSWORD` with `openssl rand -base64 24` (web/admin only). Mobile ships only public `EXPO_PUBLIC_*` vars — **never** `WORKOS_API_KEY`.
5. **Client wiring.**
   - Web/admin: `ConvexProviderWithAuth` + `AuthKitProvider` (see `apps/web/components/convex-client-provider.tsx`), middleware + `callback`/`sign-in`/`sign-up` route handlers.
   - Mobile: WorkOS PKCE in `apps/mobile/src/lib/auth.ts`, tokens in SecureStore, a custom `useAuth` bridge that refreshes (`apps/mobile/src/stores/auth.ts`). See the `mobile-expo` skill.
6. **Protected functions:** `const id = await ctx.auth.getUserIdentity(); if (!id) throw …`. Use `authKit.getAuthUser(ctx)` for the synced profile. Never accept a `userId` arg for authorization.

## Gotchas
- Var in the wrong store → silent `null` identity. **Always `npx convex env list`** to confirm `WORKOS_CLIENT_ID` (and `WORKOS_WEBHOOK_SECRET`) are on the **deployment**.
- WorkOS access-token JWTs are minimal (`sub` only) — `email`/`name` come from the synced store (`getAuthUser`), not the token.
- Redirect-URI mismatch after a port/scheme change → re-run `convex dev`.

## Verify
- `npx convex env list` shows the WorkOS deployment vars.
- A query calling `ctx.auth.getUserIdentity()` returns **non-null** while signed in, `null` after sign-out.
- First sign-in creates a row in the component's user store (webhook fired).
