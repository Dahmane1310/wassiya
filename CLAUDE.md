# Wassiya — Zero-Knowledge Legacy Vault & Dead Man's Switch

> Behavioral contract. Read fully before writing code. Rules marked **MUST**/**NEVER** are
> non-negotiable security/legal invariants — violating one is a critical bug, not a style nit.
> Durable monorepo mechanics (env stores, ports, conventions) live in the imported file below.

@AGENTS.md

## 1. Project Overview (WHY / WHAT)

Wassiya is a **zero-knowledge** vault that stores encrypted instructions for a person's
**entire estate** — physical (real estate, vehicles, bank accounts, cash, business shares)
**and** digital (crypto seeds, private documents) — and **automatically releases** them to
designated beneficiaries after death or a missed "heartbeat" check-in.

- **Market:** affluent GCC (UAE, KSA) + high-earning expats. Premium pricing
  ($79/yr · $249/lifetime) and B2B bulk licensing.
- **Two faces:** a *Living Vault* (mobile) the owner maintains while alive, and a
  *Beneficiary Release Portal* (web) that surfaces decrypted instructions after the switch fires.
- **Trust is the product.** A single leak of plaintext or a wrong inheritance fraction is an
  existential failure. Default to the paranoid, legally-correct option in every ambiguity.

## 2. Architecture & Monorepo Map

Turborepo + pnpm. Packages are `@workspace/*`, depended on via `workspace:*`, export source (no build).

- `apps/mobile` — **Expo / React Native. THE primary Living Vault.** Check-ins, asset entry,
  all client-side encryption. Auth: WorkOS PKCE (secret-less).
- `apps/web` — **Next.js. Marketing, payments, and the Beneficiary Release Portal.** Auth: WorkOS AuthKit (hosted).
- `apps/admin` — Next.js, near-mirror of `web`; internal/back-office.
- `apps/landing` — Astro, static marketing site; reuses `@workspace/ui` tokens.
- `packages/backend` — **Convex.** Real-time DB, heartbeat crons, grace-period countdowns,
  family-tree graph, Fara'id engine. Stores **only ciphertext + non-secret salts**.
- `packages/ui` (web shadcn) · `packages/ui-native` (RN Reusables) · shared eslint/ts config.

Auth identity is derived **server-side only**: `ctx.auth.getUserIdentity()` /
`authKit.getAuthUser(ctx)`. **NEVER** trust a client-passed user id.

## 3. Cryptographic Rules (HARDEST CONSTRAINTS)

Strategy: **Per-User Master Key**, derived and held **only on the device**.

- **NEVER** send a plaintext password, passphrase, or derived key to Convex. The backend
  **MUST** only ever receive/store **AES-GCM ciphertext** + **plaintext random salts**.
  It must be impossible to decrypt anything with server data alone.
- **Master key:** `PBKDF2(local passphrase, server salt)`. Derive it **ONCE per session**, hold
  it **in memory only**. **NEVER** re-run PBKDF2 per-document — Expo's Hermes engine chokes on it.
- **Per-record encryption:** every asset/document is encrypted locally with **AES-GCM 256-bit**
  using the in-memory master key + a **cryptographically-secure, fully random IV**.
- **NEVER reuse an IV under the same key.** Generate a fresh random IV per encryption operation.
  IV reuse in GCM is catastrophic — it leaks plaintext and breaks authentication.
- **Salt is non-secret and write-once.** Canonical built example: `packages/backend/convex/vault.ts`
  (`getVaultSalt`/`setVaultSalt`) + `users.vaultSalt`. Overwriting a salt orphans every document
  encrypted under the old key — `setVaultSalt` **MUST** stay write-once.
- **Passwordless fallback:** an SSO login (WorkOS — Google/Apple) has no passphrase, so the app
  **MUST** force a "Two-Step" onboarding to create a **local Vault Passphrase** used solely for
  encryption. SSO authenticates the *account*; it **NEVER** unlocks the vault.

## 4. Domain Rules (Sharia Compliance & Total-Asset Logic)

For GCC users the system **MUST** enforce Islamic inheritance law (Fara'id) across the
**entire portfolio** — houses, cash, vehicles, business shares, *and* digital assets alike.

**Order of operations is strict and non-negotiable:**
1. **Settle debts** — discharged in full first, off the top of the estate.
2. **Wasiyyah** — the freely-willed bequest. **MUST** be capped at **33.3% of the net estate**
   (after debts). The UI/engine **MUST** reject or clamp any bequest above one-third.
3. **Fara'id** — the remainder is distributed as **automatic fractional shares** to legal heirs.

- The backend **MUST** maintain a **family-tree graph** and compute exact legal fractions from
  the set of **living relatives at the moment the switch fires** (not at vault-creation time).
- Distribution fractions are **derived, never user-entered**. A user may set the Wasiyyah portion
  and beneficiaries for it; they **MUST NOT** override Fara'id fractions for legal heirs.

**Dead Man's Switch:** heartbeat cron tracks check-ins; a missed check-in starts a
**grace-period countdown**; only on expiry does the backend authorize release of (still-encrypted)
instructions to beneficiaries. Release authorization **MUST** be server-evaluated, never client-claimed.

## 5. Commands & Conventions

```bash
pnpm install
pnpm dev          # turbo: all apps + convex dev
pnpm build        # turbo build            # TODO: confirm per-app build args
pnpm lint
pnpm typecheck
pnpm format
# pnpm test       # TODO: no test runner wired yet — add turbo `test` task + per-app scripts
```

- Backend work: read `packages/backend/convex/_generated/ai/guidelines.md` **first**; it overrides
  training-data assumptions. Convex generated files under `packages/backend` are **not** hand-edited.
- Env vars live in **three separate stores** — see the README "three env stores" table; putting a
  var in the wrong store fails **silently**. Don't reproduce that table from memory.
- Add a shadcn component: `pnpm dlx shadcn@latest add <component> -c apps/<app>`.
- Deeper procedures (auth wiring, adding an app, Expo/Astro specifics) are in `.claude/skills/`.
