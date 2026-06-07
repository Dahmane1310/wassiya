import { ConvexError } from "convex/values"

// The backend gates (assetcreate/update, switch first-arm) throw
// `ConvexError("TRIAL_EXPIRED")`. ConvexError's `.data` survives to the client in BOTH
// dev and prod (a plain Error message is redacted to "Server Error" in prod), so this
// is the only reliable way to recognize the trial-expired gate on the client.
export function isTrialExpired(err: unknown): boolean {
  return err instanceof ConvexError && err.data === "TRIAL_EXPIRED"
}
