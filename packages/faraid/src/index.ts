/**
 * @workspace/faraid — Sunni Fara'id (Islamic inheritance) share engine.
 *
 * LEGAL BASIS: Jumhur (majority of the four Sunni schools) for the implemented
 * scope. EXACT integer fractions only (never floats for the legal value).
 *
 * ⚠️ NOT LEGAL ADVICE. This engine is PROVISIONAL and pending scholarly
 * certification. It implements the COMMON heir set and returns `needs_review`
 * (never a silent guess) for genuinely complex / school-divergent configurations.
 *
 * IMPLEMENTED & TESTED: spouse (incl. co-wives sharing), father, mother
 * (incl. Umariyyatan), sons & daughters, full / paternal / maternal siblings
 * (incl. sisters as ʿasaba maʿa al-ghayr with daughters), ʿawl, radd.
 *
 * DEFERRED → needs_review: grandfather as heir, son's-son substitution,
 * son's-daughter completion, grandmother as heir, full+paternal siblings
 * together, dhawu al-arham / no eligible heir, unknown deceased gender with a
 * spouse, multi-generation depth.
 */

export type Gender = "male" | "female"
export type Lineage = "full" | "paternal" | "maternal"
export type Relationship =
  | "spouse"
  | "father"
  | "mother"
  | "son"
  | "daughter"
  | "brother"
  | "sister"
  | "grandfather"
  | "grandmother"
  | "grandson"
  | "granddaughter"
  | "other"

export interface Heir {
  id: string
  relationship: Relationship
  lineage?: Lineage
  gender: Gender
  isAlive: boolean
  parentMemberId?: string
}

export interface FaraidInput {
  /** Gender of the DECEASED (owner). Needed for the spouse share; if omitted it
   *  is inferred from the spouse's gender when a spouse is present. */
  deceasedGender?: Gender
  heirs: Heir[]
}

export interface FaraidShare {
  heirId: string
  /** EXACT legal fraction, reduced. */
  numerator: number
  denominator: number
  /** Decimal — DISPLAY ONLY, never the legal value. */
  fraction: number
  /** Human label of the rule applied (e.g. "wife 1/8 (shared)"). */
  rule: string
}

export type FaraidResult =
  | {
      status: "ok"
      shares: FaraidShare[]
      adjustment: "none" | "awl" | "radd"
      /** ids of the residuary (ʿasaba) heirs, if any. */
      residuaries: string[]
    }
  | { status: "needs_review"; reason: string }

// ───────────────────────── exact rational arithmetic ─────────────────────────
type F = { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
function frac(n: number, d = 1): F {
  if (d === 0) throw new Error("zero denominator")
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(Math.abs(n), Math.abs(d)) || 1
  return { n: n / g, d: d / g }
}
const add = (a: F, b: F): F => frac(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: F, b: F): F => frac(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: F, b: F): F => frac(a.n * b.n, a.d * b.d)
/** sign of a − b */
const cmp = (a: F, b: F): number => a.n * b.d - b.n * a.d
const isZero = (a: F): boolean => a.n === 0
const ONE = frac(1)
const ZERO = frac(0)

const flag = (reason: string): FaraidResult => ({ status: "needs_review", reason })

// ───────────────────────────────── engine ────────────────────────────────────
export function computeFaraid(input: FaraidInput): FaraidResult {
  const inheriting = input.heirs.filter((h) => h.isAlive && h.relationship !== "other")

  const by = (rel: Relationship) => inheriting.filter((h) => h.relationship === rel)
  const spouses = by("spouse")
  const father = by("father")[0]
  const mother = by("mother")[0]
  const sons = by("son")
  const daughters = by("daughter")
  const brothers = by("brother")
  const sisters = by("sister")
  const grandfathers = by("grandfather")
  const grandmothers = by("grandmother")
  const grandsons = by("grandson")
  const granddaughters = by("granddaughter")

  // ── deceased gender (infer from spouse if needed) ──
  let deceasedGender = input.deceasedGender
  if (spouses.length > 0) {
    const genders = new Set(spouses.map((s) => s.gender))
    if (genders.size > 1) return flag("Spouses of mixed gender")
    const inferred: Gender = spouses[0]!.gender === "male" ? "female" : "male"
    if (!deceasedGender) deceasedGender = inferred
    else if (deceasedGender !== inferred)
      return flag("deceasedGender conflicts with the spouse's gender")
  }

  // ── spouse validity (incl. polygamy: co-wives share one spouse portion) ──
  if (spouses.length > 0) {
    if (deceasedGender === "male") {
      if (spouses.some((s) => s.gender !== "female"))
        return flag("A male deceased cannot have a husband")
      if (spouses.length > 4) return flag("More than four wives")
    } else {
      if (spouses.length > 1)
        return flag("A female deceased cannot have more than one husband")
      if (spouses[0]!.gender !== "male")
        return flag("A female deceased's spouse must be male")
    }
  }

  // ── descendants ──
  // grandson/granddaughter: paternal (son's child) inherits; maternal (daughter's
  // child) is dhawu al-arham — non-inheriting in the Jumhur scope.
  const patGrandsons = grandsons.filter((g) => g.lineage !== "maternal")
  const patGranddaughters = granddaughters.filter((g) => g.lineage !== "maternal")

  const hasSon = sons.length > 0
  const hasMaleDesc = hasSon || patGrandsons.length > 0
  const hasFemaleDesc = daughters.length > 0 || patGranddaughters.length > 0
  const hasDescendant = hasMaleDesc || hasFemaleDesc

  // ── deferred-complexity flags (never guess) ──
  if (granddaughters.some((g) => g.lineage === "maternal") || grandsons.some((g) => g.lineage === "maternal")) {
    // Daughter's children only matter if they would otherwise be sole heirs.
    if (inheriting.every((h) => h.relationship === "grandson" || h.relationship === "granddaughter"))
      return flag("Only dhawu al-arham (daughter's children) — deferred for review")
  }
  if (grandfathers.length > 0 && !father)
    return flag("Grandfather as heir (substitution / muqāsama) — deferred for review")
  if (patGrandsons.length > 0 && !hasSon)
    return flag("Son's son substitution — deferred for review")
  if (patGranddaughters.length > 0 && !(hasSon || daughters.length >= 2))
    return flag("Son's daughter completion — deferred for review")
  if (grandmothers.length > 0 && !mother) {
    const eligible = grandmothers.filter((g) => !(g.lineage === "paternal" && father))
    if (eligible.length > 0) return flag("Grandmother as heir — deferred for review")
  }

  // ── sibling sets ──
  const lin = (h: Heir): Lineage => h.lineage ?? "full"
  const allSibs = [...brothers, ...sisters]
  const maternalSibs = allSibs.filter((s) => lin(s) === "maternal")
  const fullBrothers = brothers.filter((b) => lin(b) === "full")
  const fullSisters = sisters.filter((s) => lin(s) === "full")
  const patBrothers = brothers.filter((b) => lin(b) === "paternal")
  const patSisters = sisters.filter((s) => lin(s) === "paternal")

  // Collaterals inherit only with no descendant and no father (grandfather flagged above).
  const collateralsInherit = !hasDescendant && !father
  if (
    collateralsInherit &&
    fullBrothers.length + fullSisters.length > 0 &&
    patBrothers.length + patSisters.length > 0
  )
    return flag("Full and paternal siblings together — deferred for review")

  if (inheriting.length === 0) return flag("No eligible heirs (estate to the treasury)")

  // ── accumulate fixed shares (furud) ──
  type Assigned = { id: string; share: F; rule: string }
  const furud: Assigned[] = []
  const put = (id: string, share: F, rule: string) => furud.push({ id, share, rule })
  const splitEqually = (ids: string[], total: F, rule: string) => {
    const each = frac(total.n, total.d * ids.length)
    ids.forEach((id) => put(id, each, rule))
  }

  // spouse
  if (spouses.length > 0) {
    if (deceasedGender === "male") {
      const total = hasDescendant ? frac(1, 8) : frac(1, 4)
      splitEqually(
        spouses.map((s) => s.id),
        total,
        spouses.length > 1
          ? hasDescendant
            ? "wives 1/8 (shared)"
            : "wives 1/4 (shared)"
          : hasDescendant
            ? "wife 1/8"
            : "wife 1/4"
      )
    } else {
      put(spouses[0]!.id, hasDescendant ? frac(1, 4) : frac(1, 2), hasDescendant ? "husband 1/4" : "husband 1/2")
    }
  }

  // ── Umariyyatan: ONLY spouse + father + mother ──
  if (spouses.length > 0 && father && mother && !hasDescendant && allSibs.length === 0) {
    const spouseShare = furud.find((x) => x.id === spouses[0]!.id)!.share
    const remainder = sub(ONE, spouseShare)
    const motherShare = mul(remainder, frac(1, 3))
    put(mother.id, motherShare, "mother 1/3 of remainder (Umariyyah)")
    put(father.id, sub(remainder, motherShare), "father residue (Umariyyah)")
    return finalize(furud, [], "none")
  }

  // mother — 1/6 with a descendant OR ≥2 siblings (of any kind, even if blocked); else 1/3.
  if (mother) {
    const reducedBySiblings = allSibs.length >= 2
    const sixth = hasDescendant || reducedBySiblings
    put(mother.id, sixth ? frac(1, 6) : frac(1, 3), sixth ? "mother 1/6" : "mother 1/3")
  }

  // maternal siblings — 1/6 (one) or 1/3 (two+) shared equally, gender-blind.
  if (collateralsInherit && maternalSibs.length > 0) {
    splitEqually(
      maternalSibs.map((s) => s.id),
      maternalSibs.length === 1 ? frac(1, 6) : frac(1, 3),
      maternalSibs.length === 1 ? "maternal sibling 1/6" : "maternal siblings 1/3 (shared)"
    )
  }

  // father — 1/6 with a male descendant; 1/6 + residue with only female descendants;
  // pure residuary with no descendant (handled in the residuary phase).
  if (father && hasDescendant) {
    put(father.id, frac(1, 6), hasMaleDesc ? "father 1/6" : "father 1/6 + residue")
  }

  // ── determine the residuary (ʿasaba) group ──
  let residuary: { ids: string[]; weights: number[]; rule: string } | null = null

  if (hasSon) {
    const ids = [...sons, ...daughters].map((h) => h.id)
    const weights = [...sons.map(() => 2), ...daughters.map(() => 1)]
    residuary = { ids, weights, rule: "children (residue, 2:1)" }
  } else if (hasFemaleDesc) {
    // Daughters / son's-daughters take a fixed share; the next residuary is father,
    // else full (then paternal) siblings become ʿasaba maʿa al-ghayr.
    if (daughters.length === 1) put(daughters[0]!.id, frac(1, 2), "daughter 1/2")
    else if (daughters.length >= 2)
      splitEqually(daughters.map((d) => d.id), frac(2, 3), "daughters 2/3 (shared)")
    else if (patGranddaughters.length === 1) put(patGranddaughters[0]!.id, frac(1, 2), "son's daughter 1/2")
    else if (patGranddaughters.length >= 2)
      splitEqually(patGranddaughters.map((d) => d.id), frac(2, 3), "son's daughters 2/3 (shared)")

    if (father) {
      residuary = { ids: [father.id], weights: [1], rule: "father (residue)" }
    } else if (fullBrothers.length + fullSisters.length > 0) {
      residuary = residuaryFromSiblings(fullBrothers, fullSisters, "full siblings (residue maʿa al-ghayr)")
    } else if (patBrothers.length + patSisters.length > 0) {
      residuary = residuaryFromSiblings(patBrothers, patSisters, "paternal siblings (residue maʿa al-ghayr)")
    }
    // else: no residuary → radd to the daughters.
  } else if (father) {
    residuary = { ids: [father.id], weights: [1], rule: "father (residue)" }
  } else if (collateralsInherit) {
    // No descendant, no father. Full siblings first, then paternal.
    if (fullBrothers.length > 0) {
      residuary = residuaryFromSiblings(fullBrothers, fullSisters, "full siblings (residue, 2:1)")
    } else if (fullSisters.length > 0) {
      // Full sisters with no brother & no descendant → fixed share (1/2 or 2/3).
      if (fullSisters.length === 1) put(fullSisters[0]!.id, frac(1, 2), "full sister 1/2")
      else splitEqually(fullSisters.map((s) => s.id), frac(2, 3), "full sisters 2/3 (shared)")
      // A paternal brother (no full brother) is then the residuary; paternal sisters are blocked.
      if (patBrothers.length > 0) {
        residuary = residuaryFromSiblings(patBrothers, [], "paternal brothers (residue)")
      }
    } else if (patBrothers.length > 0) {
      residuary = residuaryFromSiblings(patBrothers, patSisters, "paternal siblings (residue, 2:1)")
    } else if (patSisters.length > 0) {
      if (patSisters.length === 1) put(patSisters[0]!.id, frac(1, 2), "paternal sister 1/2")
      else splitEqually(patSisters.map((s) => s.id), frac(2, 3), "paternal sisters 2/3 (shared)")
    }
  }

  return finalize(furud, residuary ? [residuary] : [], "none", spouses.map((s) => s.id))
}

function residuaryFromSiblings(
  brothers: Heir[],
  sisters: Heir[],
  rule: string
): { ids: string[]; weights: number[]; rule: string } {
  const ids = [...brothers, ...sisters].map((h) => h.id)
  const weights = [...brothers.map(() => 2), ...sisters.map(() => 1)]
  return { ids, weights, rule }
}

// ── reconcile furud + residuary, apply ʿawl / radd, emit exact fractions ──
function finalize(
  furud: { id: string; share: F; rule: string }[],
  residuaryGroups: { ids: string[]; weights: number[]; rule: string }[],
  _adjust: "none",
  spouseIds: string[] = []
): FaraidResult {
  const map = new Map<string, { share: F; rule: string }>()
  for (const a of furud) {
    const ex = map.get(a.id)
    map.set(a.id, ex ? { share: add(ex.share, a.share), rule: ex.rule } : { share: a.share, rule: a.rule })
  }

  let totalFurud = ZERO
  for (const { share } of map.values()) totalFurud = add(totalFurud, share)

  let adjustment: "none" | "awl" | "radd" = "none"
  const residuaryIds: string[] = []

  const residuary = residuaryGroups[0]

  if (residuary && residuary.ids.length > 0) {
    const residue = sub(ONE, totalFurud)
    if (cmp(residue, ZERO) < 0) {
      // Fixed shares already exceed the estate while a residuary exists — invalid config.
      return flag("Inconsistent shares (furud exceed the estate with a residuary present)")
    }
    const totalWeight = residuary.weights.reduce((s, w) => s + w, 0)
    residuary.ids.forEach((id, i) => {
      const portion = mul(residue, frac(residuary.weights[i]!, totalWeight))
      if (!isZero(portion)) {
        const ex = map.get(id)
        map.set(id, ex ? { share: add(ex.share, portion), rule: ex.rule } : { share: portion, rule: residuary.rule })
        residuaryIds.push(id)
      }
    })
  } else {
    const c = cmp(totalFurud, ONE)
    if (c > 0) {
      // ʿAwl — proportionally reduce every share (each share ÷ total raises the
      // common denominator so the shares sum back to 1).
      adjustment = "awl"
      for (const [id, v] of map) {
        map.set(id, { share: mul(furudShare(furud, id), invert(totalFurud)), rule: v.rule })
      }
    } else if (c < 0) {
      // Radd — return surplus to non-spouse sharers proportionally; spouse excluded.
      adjustment = "radd"
      const spouseSet = new Set(spouseIds)
      const nonSpouse = [...map.keys()].filter((id) => !spouseSet.has(id))
      if (nonSpouse.length === 0) {
        return flag("Radd with only a spouse — treasury vs. spouse is jurisdiction-specific (review)")
      }
      let spouseTotal = ZERO
      for (const id of spouseIds) {
        const v = map.get(id)
        if (v) spouseTotal = add(spouseTotal, v.share)
      }
      let nonSpouseFurud = ZERO
      for (const id of nonSpouse) nonSpouseFurud = add(nonSpouseFurud, map.get(id)!.share)
      const remaining = sub(ONE, spouseTotal)
      for (const id of nonSpouse) {
        const v = map.get(id)!
        const scaled = mul(remaining, frac(v.share.n * nonSpouseFurud.d, v.share.d * nonSpouseFurud.n))
        map.set(id, { share: scaled, rule: v.rule })
      }
    }
  }

  // ── sum-to-1 invariant: EVERY ok result must total exactly 1 ──
  let sum = ZERO
  for (const { share } of map.values()) sum = add(sum, share)
  if (cmp(sum, ONE) !== 0) {
    return flag(`Internal: shares sum to ${sum.n}/${sum.d}, not 1 — refusing to emit a wrong distribution`)
  }

  const shares: FaraidShare[] = [...map.entries()]
    .filter(([, v]) => !isZero(v.share))
    .map(([heirId, v]) => ({
      heirId,
      numerator: v.share.n,
      denominator: v.share.d,
      fraction: v.share.n / v.share.d,
      rule: v.rule,
    }))

  return { status: "ok", shares, adjustment, residuaries: residuaryIds }
}

// helpers used by ʿawl scaling
function furudShare(furud: { id: string; share: F }[], id: string): F {
  let s = ZERO
  for (const a of furud) if (a.id === id) s = add(s, a.share)
  return s
}
const invert = (a: F): F => frac(a.d, a.n)
