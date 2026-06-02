# wassiya

A Turborepo + pnpm template for bootstrapping apps on **Convex** with **WorkOS AuthKit** auth, across **web (Next.js)** and **mobile (Expo)**.

```
apps/
  web/            Next.js 16 app (Convex + WorkOS AuthKit)
  mobile/         Expo (React Native) app (Convex + WorkOS AuthKit, PKCE)
packages/
  backend/        Convex deployment: schema, functions, auth config (@workspace/backend)
  ui/             Shared shadcn/ui components (@workspace/ui)
  eslint-config/  Shared ESLint config
  typescript-config/ Shared tsconfig presets
```

Both apps talk to the **same** Convex deployment and the **same** WorkOS environment. The backend's `convex/auth.config.ts` validates WorkOS JWTs, so any client (web or native) authenticates against it unchanged.

## Prerequisites

- Node 20+, `pnpm` 10+
- A Convex account (`npx convex dev` will prompt login)
- For the **native app's auth**: a **development build** — Expo Go will NOT work (custom OAuth scheme + a WebCrypto polyfill need native code). On Windows use Android (`expo run:android`); iOS needs macOS.

## Bootstrapping a new app from this template

### 1. Install
```bash
pnpm install
```

### 2. Provision Convex + WorkOS (managed AuthKit)
```bash
pnpm --filter @workspace/backend dev      # = npx convex dev
```
First run is interactive: it logs you into Convex, **provisions a managed WorkOS team**, sets `WORKOS_CLIENT_ID` / `WORKOS_API_KEY` on the deployment, and writes `packages/backend/.env.local`. Leave it running (it also serves the backend).

### 3. Wire the WorkOS webhook (user sync)
`convex/http.ts` registers the AuthKit component's webhook, which reads `WORKOS_WEBHOOK_SECRET` — the **first push fails without it**. In the WorkOS dashboard add a webhook to `https://<your-deployment>.convex.site/workos/webhook` (events `user.created|updated|deleted`), then:
```bash
cd packages/backend && npx convex env set WORKOS_WEBHOOK_SECRET <secret>
```
Re-run `convex dev`. (To unblock the push before wiring the real webhook, set any placeholder value.)

### 4. Web app env
```bash
cp apps/web/.env.example apps/web/.env.local
```
Fill it: `NEXT_PUBLIC_CONVEX_URL` (the deployment URL), mirror `WORKOS_CLIENT_ID` + `WORKOS_API_KEY` from `packages/backend/.env.local`, and generate `WORKOS_COOKIE_PASSWORD` with `openssl rand -base64 24`.

### 5. Native app env + dev build
```bash
cp apps/mobile/.env.example apps/mobile/.env.local   # fill EXPO_PUBLIC_CONVEX_URL + EXPO_PUBLIC_WORKOS_CLIENT_ID
```
Register the mobile redirect URI: it's already in `packages/backend/convex.json` (`wassiya://callback`) — re-run `convex dev` once so WorkOS picks it up. Then build a dev client:
```bash
cd apps/mobile
npx expo prebuild --clean
npx expo run:android          # or run:ios on macOS
```

### 6. Run everything
```bash
pnpm dev                      # turbo: web + convex dev (+ native if started)
```

## ⚠️ The env-var trap: three separate stores

`convex/auth.config.ts` runs on the **Convex deployment**, whose env is a *separate store* from any `.env.local`. A var in the wrong place fails **silently** (`getUserIdentity()` returns `null` while the client looks signed in). Map:

| Var | Convex deployment | apps/web/.env.local | apps/mobile/.env.local |
| --- | :---: | :---: | :---: |
| `WORKOS_CLIENT_ID` | ✅ (auth.config) | ✅ | ✅ (`EXPO_PUBLIC_`) |
| `WORKOS_API_KEY` | — | ✅ | ❌ never (PKCE is secret-less) |
| `WORKOS_COOKIE_PASSWORD` | — | ✅ | — |
| `WORKOS_WEBHOOK_SECRET` | ✅ | — | — |
| `*_CONVEX_URL` | — | ✅ | ✅ (`EXPO_PUBLIC_`) |
| `*_WORKOS_REDIRECT_URI` | — | ✅ `…:3001/callback` | ✅ `wassiya://callback` |

`convex.json` `localEnvVars` only writes to `packages/backend/.env.local` — mirror the needed values into each app's `.env.local` yourself. Verify deployment vars with `npx convex env list`.

## Adding shadcn/ui components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```
Components land in `packages/ui/src/components` and import as `@workspace/ui/components/button`.

## Auth model notes

- Web uses `@workos-inc/authkit-nextjs` (hosted session + `ConvexProviderWithAuth`).
- Native uses the WorkOS PKCE flow (`@workos-inc/node`, no client secret in the bundle), tokens in `expo-secure-store`, refreshed by the `fetchAccessToken` bridge in `apps/mobile/src/context/auth-context.tsx`.
- Users sync into Convex via the `@convex-dev/workos-authkit` component (webhook). Read the current user in functions with `ctx.auth.getUserIdentity()` or `authKit.getAuthUser(ctx)`.
