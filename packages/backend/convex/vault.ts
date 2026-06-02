import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// The per-user PBKDF2 salt for client-side, zero-knowledge encryption. The salt
// is non-secret: the master passphrase and derived key NEVER leave the device,
// so the server stores only the salt and the resulting ciphertext.

/** Returns the current user's vault salt (base64), or `null` if not yet set. */
export const getVaultSalt = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    return user?.vaultSalt ?? null
  },
})

/**
 * Persists the vault salt the first time the user sets up their vault. The salt
 * is write-once: overwriting it would orphan every document already encrypted
 * under the key derived from it, so an existing salt is returned unchanged.
 */
export const setVaultSalt = mutation({
  args: { vaultSalt: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error("Not authenticated")
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    if (existing !== null) {
      return existing.vaultSalt
    }
    await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      vaultSalt: args.vaultSalt,
    })
    return args.vaultSalt
  },
})
