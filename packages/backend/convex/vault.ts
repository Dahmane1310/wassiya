import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { TRIAL_MS } from "./lib/entitlements"
import { isAccountDisabled, requireEnabledUser } from "./lib/account"

// Shape of an encrypted package — mirrors `EncryptedDataPackage` from
// @workspace/crypto and the `encrypted` column validator in schema.ts.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

// ZERO-KNOWLEDGE: the master key and the PIN NEVER reach the server. We persist only
// the non-secret recovery salt, the RECOVERY-key-wrapped master key (high-entropy
// code ⇒ offline brute force infeasible), and an AES-GCM verifier. The PIN wrap lives
// only on the device. The server can never decrypt anything with its own data.

const EMPTY = {
  recoverySalt: null,
  recoveryWrappedKey: null,
  recoveryWrapIv: null,
  vaultVerifier: null,
  onboardingComplete: false,
  disabled: false,
}

/**
 * The current user's vault / onboarding state. Returns an all-empty shape when
 * unauthenticated OR when the `users` row doesn't exist yet (it's created lazily by
 * `completeVaultSetup`) — both mean "needs onboarding". The recovery trio is consumed
 * only by the recovery flow (new device / forgotten PIN); routing uses existence +
 * `onboardingComplete`. This is the mobile GATE query, so it carries the explicit
 * `disabled` flag (support-disabled account) instead of throwing — the gate routes
 * to a disabled screen; every other function rejects via lib/account.ts.
 */
export const getVaultStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return EMPTY
    }
    if (await isAccountDisabled(ctx, identity.tokenIdentifier)) {
      return { ...EMPTY, disabled: true }
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (user === null) {
      return EMPTY
    }
    return {
      recoverySalt: user.recoverySalt,
      recoveryWrappedKey: user.recoveryWrappedKey,
      recoveryWrapIv: user.recoveryWrapIv,
      vaultVerifier: user.vaultVerifier ?? null,
      onboardingComplete: user.onboardingComplete ?? false,
      disabled: false,
    }
  },
})

/**
 * Completes onboarding atomically: persists the write-once recovery salt + the
 * recovery-wrapped master key + the verifier in a single transaction (so there is
 * never an observable half-set-up state).
 *
 * INVARIANT: the args carry ONLY the recovery wrap + verifier — never the PIN, the
 * PIN salt, or the PIN wrap (those are device-local). The recovery wrap is WRITE-ONCE
 * for the same reason the salt was: a second device that re-ran setup would generate a
 * fresh master key and orphan everything wrapped under the first one. If a vault
 * already exists we return the stored values unchanged; the client detects the
 * mismatch (its locally-minted MK differs) and routes to recovery instead.
 */
export const completeVaultSetup = mutation({
  args: {
    recoverySalt: v.string(),
    recoveryWrappedKey: v.string(),
    recoveryWrapIv: v.string(),
    vaultVerifier: encrypted,
  },
  handler: async (ctx, args) => {
    const identity = await requireEnabledUser(ctx)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    // Already initialized (all fields are written atomically). Never overwrite the
    // write-once recovery wrap; return what's stored so the client detects a mismatch.
    if (existing !== null) {
      return {
        recoverySalt: existing.recoverySalt,
        recoveryWrappedKey: existing.recoveryWrappedKey,
        recoveryWrapIv: existing.recoveryWrapIv,
        vaultVerifier: existing.vaultVerifier ?? null,
        onboardingComplete: existing.onboardingComplete ?? false,
      }
    }

    await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      recoverySalt: args.recoverySalt,
      recoveryWrappedKey: args.recoveryWrappedKey,
      recoveryWrapIv: args.recoveryWrapIv,
      vaultVerifier: args.vaultVerifier,
      onboardingComplete: true,
    })

    // Admin-provisioned account just onboarded — the panel's "awaiting setup"
    // registry entry is consumed; the real `users` row represents them now.
    const provisioned = await ctx.db
      .query("provisionedAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", identity.tokenIdentifier))
      .unique()
    if (provisioned !== null) {
      await ctx.db.delete(provisioned._id)
    }

    // Start the 14-day trial — but never clobber a pay-before-onboard grant.
    const ent = await ctx.db
      .query("entitlements")
      .withIndex("by_ownerId", (q) =>
        q.eq("ownerId", identity.tokenIdentifier)
      )
      .unique()
    if (ent === null) {
      const now = Date.now()
      await ctx.db.insert("entitlements", {
        ownerId: identity.tokenIdentifier,
        plan: "trial",
        status: "trialing",
        source: "trial",
        currentPeriodEnd: now + TRIAL_MS,
      })
      await ctx.db.insert("billingEvents", {
        ownerId: identity.tokenIdentifier,
        source: "trial",
        type: "trial_started",
        plan: "trial",
      })
    }

    return {
      recoverySalt: args.recoverySalt,
      recoveryWrappedKey: args.recoveryWrappedKey,
      recoveryWrapIv: args.recoveryWrapIv,
      vaultVerifier: args.vaultVerifier,
      onboardingComplete: true,
    }
  },
})
