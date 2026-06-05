import { describe, expect, it } from "vitest"
import { computeFaraid, type FaraidResult, type Gender, type Heir, type Relationship } from "./index"

// Fixtures are transcribed from external Fara'id references and standard worked
// examples (NOT derived in-house), so the gate is authored independently of the
// engine. Anchors:
//  - ʿAwl husband+2 full sisters → 3/7, 4/7 — islamicinheritancelaws.com Lesson 12
//  - Radd widow+daughter → 1/8, 7/8 — Awqaf SA / learndeen worked example
//  - Umariyyatan, asaba maʿa al-ghayr — canonical mawārīth tables
// Plus a universal invariant: every `ok` result's shares sum to EXACTLY 1.

function heir(id: string, relationship: Relationship, gender: Gender, extra: Partial<Heir> = {}): Heir {
  return { id, relationship, gender, isAlive: true, ...extra }
}

function expectShares(
  res: FaraidResult,
  expected: Record<string, [number, number]>,
  adjustment?: "none" | "awl" | "radd"
) {
  expect(res.status).toBe("ok")
  if (res.status !== "ok") return
  const got: Record<string, [number, number]> = {}
  for (const s of res.shares) got[s.heirId] = [s.numerator, s.denominator]
  expect(got).toEqual(expected)
  // Independent sum-to-1 sanity check (the legal value is exact integers).
  const sum = res.shares.reduce((acc: number, s) => acc + s.numerator / s.denominator, 0)
  expect(Math.abs(sum - 1)).toBeLessThan(1e-9)
  if (adjustment) expect(res.adjustment).toBe(adjustment)
}

describe("furud + residuary basics", () => {
  it("son + daughter → 2/3, 1/3", () => {
    expectShares(computeFaraid({ heirs: [heir("s", "son", "male"), heir("d", "daughter", "female")] }), {
      s: [2, 3],
      d: [1, 3],
    })
  })

  it("husband + daughter + father → 1/4, 1/2, 1/4 (father 1/6 + residue)", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [heir("h", "spouse", "male"), heir("d", "daughter", "female"), heir("f", "father", "male")],
      }),
      { h: [1, 4], d: [1, 2], f: [1, 4] }
    )
  })

  it("mother + father + son → 1/6, 1/6, 2/3", () => {
    expectShares(
      computeFaraid({
        heirs: [heir("m", "mother", "female"), heir("f", "father", "male"), heir("s", "son", "male")],
      }),
      { m: [1, 6], f: [1, 6], s: [2, 3] }
    )
  })

  it("wife + 2 sons + 2 daughters → wife 1/8, sons 7/24, daughters 7/48", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "male",
        heirs: [
          heir("w", "spouse", "female"),
          heir("s1", "son", "male"),
          heir("s2", "son", "male"),
          heir("d1", "daughter", "female"),
          heir("d2", "daughter", "female"),
        ],
      }),
      { w: [1, 8], s1: [7, 24], s2: [7, 24], d1: [7, 48], d2: [7, 48] }
    )
  })

  it("2 daughters + father + mother → daughters 1/3 each, mother 1/6, father 1/6", () => {
    expectShares(
      computeFaraid({
        heirs: [
          heir("d1", "daughter", "female"),
          heir("d2", "daughter", "female"),
          heir("f", "father", "male"),
          heir("m", "mother", "female"),
        ],
      }),
      { d1: [1, 3], d2: [1, 3], f: [1, 6], m: [1, 6] }
    )
  })
})

describe("Umariyyatan (spouse + both parents)", () => {
  it("husband + father + mother → 1/2, 1/3, 1/6 (mother 1/3 of remainder)", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [heir("h", "spouse", "male"), heir("f", "father", "male"), heir("m", "mother", "female")],
      }),
      { h: [1, 2], m: [1, 6], f: [1, 3] }
    )
  })

  it("wife + father + mother → 1/4, 1/2, 1/4", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "male",
        heirs: [heir("w", "spouse", "female"), heir("f", "father", "male"), heir("m", "mother", "female")],
      }),
      { w: [1, 4], m: [1, 4], f: [1, 2] }
    )
  })
})

describe("ʿawl (shares exceed 1)", () => {
  it("husband + 2 full sisters → 3/7, 2/7, 2/7 [ext: Lesson 12]", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [
          heir("h", "spouse", "male"),
          heir("s1", "sister", "female", { lineage: "full" }),
          heir("s2", "sister", "female", { lineage: "full" }),
        ],
      }),
      { h: [3, 7], s1: [2, 7], s2: [2, 7] },
      "awl"
    )
  })

  it("husband + 2 full sisters + 1 maternal brother → 3/8, 1/4, 1/4, 1/8 (awl to 8)", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [
          heir("h", "spouse", "male"),
          heir("s1", "sister", "female", { lineage: "full" }),
          heir("s2", "sister", "female", { lineage: "full" }),
          heir("mb", "brother", "male", { lineage: "maternal" }),
        ],
      }),
      { h: [3, 8], s1: [1, 4], s2: [1, 4], mb: [1, 8] },
      "awl"
    )
  })
})

describe("radd (residue returned, spouse excluded)", () => {
  it("widow + 1 daughter → 1/8, 7/8 [ext: Awqaf SA]", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "male",
        heirs: [heir("w", "spouse", "female"), heir("d", "daughter", "female")],
      }),
      { w: [1, 8], d: [7, 8] },
      "radd"
    )
  })

  it("mother + 2 daughters → mother 1/5, daughters 2/5 each", () => {
    expectShares(
      computeFaraid({
        heirs: [
          heir("m", "mother", "female"),
          heir("d1", "daughter", "female"),
          heir("d2", "daughter", "female"),
        ],
      }),
      { m: [1, 5], d1: [2, 5], d2: [2, 5] },
      "radd"
    )
  })

  it("single daughter → 1/1 (radd returns all)", () => {
    expectShares(computeFaraid({ heirs: [heir("d", "daughter", "female")] }), { d: [1, 1] }, "radd")
  })
})

describe("siblings", () => {
  it("daughter + full sister → 1/2, 1/2 (sister = asaba maʿa al-ghayr)", () => {
    expectShares(
      computeFaraid({
        heirs: [heir("d", "daughter", "female"), heir("fs", "sister", "female", { lineage: "full" })],
      }),
      { d: [1, 2], fs: [1, 2] }
    )
  })

  it("husband + full sister → 1/2, 1/2", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [heir("h", "spouse", "male"), heir("fs", "sister", "female", { lineage: "full" })],
      }),
      { h: [1, 2], fs: [1, 2] }
    )
  })

  it("husband + mother + 2 maternal brothers → 1/2, 1/6, 1/6, 1/6", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "female",
        heirs: [
          heir("h", "spouse", "male"),
          heir("m", "mother", "female"),
          heir("mb1", "brother", "male", { lineage: "maternal" }),
          heir("mb2", "brother", "male", { lineage: "maternal" }),
        ],
      }),
      { h: [1, 2], m: [1, 6], mb1: [1, 6], mb2: [1, 6] }
    )
  })

  it("full brother + full sister → 2/3, 1/3", () => {
    expectShares(
      computeFaraid({
        heirs: [
          heir("b", "brother", "male", { lineage: "full" }),
          heir("s", "sister", "female", { lineage: "full" }),
        ],
      }),
      { b: [2, 3], s: [1, 3] }
    )
  })
})

describe("polygamy", () => {
  it("2 wives + son → wives 1/16 each, son 7/8", () => {
    expectShares(
      computeFaraid({
        deceasedGender: "male",
        heirs: [
          heir("w1", "spouse", "female"),
          heir("w2", "spouse", "female"),
          heir("s", "son", "male"),
        ],
      }),
      { w1: [1, 16], w2: [1, 16], s: [7, 8] }
    )
  })
})

describe("needs_review (never a silent guess)", () => {
  const review = (heirs: Heir[], deceasedGender?: Gender) =>
    expect(computeFaraid({ deceasedGender, heirs }).status).toBe("needs_review")

  it("grandfather + brother → flagged", () => {
    review([
      heir("gf", "grandfather", "male"),
      heir("b", "brother", "male", { lineage: "full" }),
    ])
  })

  it("1 daughter + 1 son's daughter (completion) → flagged", () => {
    review([
      heir("d", "daughter", "female"),
      heir("sd", "granddaughter", "female", { lineage: "paternal" }),
    ])
  })

  it("grandmother as heir (no mother) → flagged", () => {
    review([heir("gm", "grandmother", "female"), heir("s", "son", "male")])
  })

  it("female deceased + 2 husbands → flagged", () => {
    review(
      [heir("h1", "spouse", "male"), heir("h2", "spouse", "male")],
      "female"
    )
  })

  it("no eligible heirs → flagged", () => {
    review([heir("x", "other", "male")])
  })
})
