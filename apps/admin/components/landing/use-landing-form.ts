"use client"

import { useMemo, useState } from "react"
import { type Dict, type SectionSpec } from "@workspace/landing-content"

export type LandingForm = {
  value: Dict
  /** Immutable update at a dot path (e.g. "hero.sub", "pricing.tiers"). */
  setAt: (path: string, next: unknown) => void
  getAt: (path: string) => unknown
  /** Local edits not yet saved as a draft. */
  dirty: boolean
  /** Local edits within ONE section's fields — drives the rail dots. */
  sectionDirty: (section: SectionSpec) => boolean
  /** After a successful save: current value becomes the clean baseline. */
  markSaved: () => void
  /** After a discard: replace the form wholesale. */
  reset: (to: Dict) => void
}

function setPath(obj: unknown, keys: string[], next: unknown): unknown {
  if (keys.length === 0) return next
  const [head, ...rest] = keys
  const base = (obj ?? {}) as Record<string, unknown>
  return { ...base, [head!]: setPath(base[head!], rest, next) }
}

function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

/** Local working copy of one language's dict. Mount only once the initial
 *  value is known — later server refetches never clobber in-progress edits. */
export function useLandingForm(initial: Dict): LandingForm {
  const [value, setValue] = useState<Dict>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  // Cheap enough at ~15KB; recomputed only on render after edits.
  const dirty = JSON.stringify(value) !== baseline
  const baselineValue = useMemo(() => JSON.parse(baseline) as Dict, [baseline])

  return {
    value,
    getAt: (path) => getPath(value, path),
    setAt: (path, next) =>
      setValue((prev) => setPath(prev, path.split("."), next) as Dict),
    dirty,
    sectionDirty: (section) =>
      section.fields.some(
        (f) =>
          JSON.stringify(getPath(value, f.path)) !==
          JSON.stringify(getPath(baselineValue, f.path)),
      ),
    markSaved: () => setBaseline(JSON.stringify(value)),
    reset: (to) => {
      setBaseline(JSON.stringify(to))
      setValue(to)
    },
  }
}
