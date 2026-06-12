import { ar } from "./defaults/ar"
import { en } from "./defaults/en"
import type { Dict, Lang } from "./types"

/** The checked-in copy — the landing's permanent build fallback and the admin
 *  editor's initial values. Once content is published, Convex is the source of
 *  truth and these are only the safety net. */
export const DEFAULT_DICTS: Record<Lang, Dict> = { en, ar }

export { en, ar }
export type {
  Dict,
  Lang,
  Stat,
  Step,
  IconStep,
  Tier,
  Testimonial,
  QA,
  FooterCol,
} from "./types"
export {
  ICON_NAMES,
  IMAGE_SLOTS,
  LANDING_MANIFEST,
  type FieldSpec,
  type IconName,
  type ImageSlotId,
  type ItemField,
  type LandingImages,
  type SectionSpec,
} from "./manifest"
