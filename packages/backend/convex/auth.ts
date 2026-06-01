import { AuthKit } from "@convex-dev/workos-authkit"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"

// Owns the synced WorkOS user store. Read the current user in functions with
// `authKit.getAuthUser(ctx)`. Do not hand-roll a parallel `users` table.
export const authKit = new AuthKit<DataModel>(components.workOSAuthKit)
