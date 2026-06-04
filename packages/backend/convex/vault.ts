import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Shape of the encrypted passphrase verifier — mirrors `EncryptedDataPackage`
// from @workspace/crypto and the `encrypted` column validator in schema.ts.
const encrypted = v.object({ ciphertext: v.string(), iv: v.string() })

// ZERO-KNOWLEDGE: the master passphrase and the derived key NEVER reach the
// server. We persist only the non-secret PBKDF2 salt and AES-GCM ciphertext
// (the verifier). The server can never decrypt anything with its own data.

/**
 * The current user's vault / onboarding state. Returns an all-empty shape when
 * unauthenticated OR when the `users` row doesn't exist yet (it's created lazily
 * by `completeVaultSetup`) — both cases mean "needs onboarding".
 */
export const getVaultStatus = query({
  args: {},
  handler: async (ctx) => {
    const empty = {
      vaultSalt: null,
      passphraseVerifier: null,
      onboardingComplete: false,
    }
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return empty
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (user === null) {
      return empty
    }
    return {
      vaultSalt: user.vaultSalt,
      passphraseVerifier: user.passphraseVerifier ?? null,
      onboardingComplete: user.onboardingComplete ?? false,
    }
  },
})

/**
 * Completes the Two-Step onboarding atomically: persists the write-once PBKDF2
 * salt, the encrypted passphrase verifier, and `onboardingComplete` in a single
 * transaction (so there is never an observable "salt without verifier" state).
 *
 * The salt is WRITE-ONCE — overwriting it would orphan every record encrypted
 * under the key derived from the old salt. If a vault already exists we return
 * its stored salt unchanged; the client compares it against the salt it just
 * generated and, on mismatch (a reinstall / second-device race), discards its
 * locally-derived key and routes to unlock instead of using a key that would
 * decrypt nothing.
 */
export const completeVaultSetup = mutation({
  args: {
    vaultSalt: v.string(),
    passphraseVerifier: encrypted,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    // Already initialized (completeVaultSetup writes all three fields atomically,
    // so any existing row is fully set up). Never overwrite the write-once salt;
    // return what's stored so the client can detect a salt mismatch.
    if (existing !== null) {
      return {
        vaultSalt: existing.vaultSalt,
        passphraseVerifier: existing.passphraseVerifier ?? null,
        onboardingComplete: existing.onboardingComplete ?? false,
      }
    }

    await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      vaultSalt: args.vaultSalt,
      passphraseVerifier: args.passphraseVerifier,
      onboardingComplete: true,
    })
    return {
      vaultSalt: args.vaultSalt,
      passphraseVerifier: args.passphraseVerifier,
      onboardingComplete: true,
    }
  },
})
