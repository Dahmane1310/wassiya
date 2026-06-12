// Checked-in copy lives in @workspace/landing-content (shared with the Convex
// backend and the admin editor); published content overrides it at build time
// via ./load.ts.
export { DEFAULT_DICTS as dicts, en, ar } from "@workspace/landing-content"
export type { Dict, Lang } from "@workspace/landing-content"
