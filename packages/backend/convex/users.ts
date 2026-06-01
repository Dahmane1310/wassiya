import { query } from "./_generated/server"
import { authKit } from "./auth"

// Protected query. A non-null result proves the WorkOS JWT reached Convex and
// `auth.config.ts` validated it. `email`/`firstName`/`lastName` come from the
// synced user store (populated by the WorkOS webhook), not the JWT — so
// `synced: true` also confirms the webhook fired.
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      return null
    }
    const user = await authKit.getAuthUser(ctx)
    return {
      subject: identity.subject,
      email: user?.email ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      synced: user !== null,
    }
  },
})
