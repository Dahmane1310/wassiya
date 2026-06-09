import { ar } from "./ar"
import { en } from "./en"
import type { Dict, Lang } from "./types"

export const dicts: Record<Lang, Dict> = { en, ar }

export { en, ar }
export type { Dict, Lang } from "./types"
