import { v } from "convex/values"
import { query, type QueryCtx } from "../_generated/server"
import { requireAdmin } from "../lib/adminAuth"

// Live dashboard metrics. Convex has no count operator, so every figure is an
// HONEST bounded count: scan up to CAP+1 rows through an index and report
// `capped: true` past the cap (the UI renders "1000+"). No denormalized counter
// docs to drift. Reactivity keeps the dashboard live for free.

const CAP = 1000

const countShape = v.object({ value: v.number(), capped: v.boolean() })

type Counted = { value: number; capped: boolean }

function summarize(rows: unknown[]): Counted {
  return { value: Math.min(rows.length, CAP), capped: rows.length > CAP }
}

async function countSwitch(
  ctx: QueryCtx,
  state: "active" | "grace" | "pendingVerification" | "released" | "paused",
): Promise<Counted> {
  const rows = await ctx.db
    .query("switchState")
    .withIndex("by_state_and_nextDeadlineAt", (q) => q.eq("state", state))
    .take(CAP + 1)
  return summarize(rows)
}

async function countEntitlement(
  ctx: QueryCtx,
  status: "trialing" | "active" | "past_due" | "canceled" | "expired",
): Promise<Counted> {
  const rows = await ctx.db
    .query("entitlements")
    .withIndex("by_status_and_currentPeriodEnd", (q) => q.eq("status", status))
    .take(CAP + 1)
  return summarize(rows)
}

async function countDeathCases(
  ctx: QueryCtx,
  status: "under_review" | "approved" | "rejected",
): Promise<Counted> {
  const rows = await ctx.db
    .query("deathVerification")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(CAP + 1)
  return summarize(rows)
}

async function countNotifications(
  ctx: QueryCtx,
  status: "pending" | "failed",
): Promise<Counted> {
  const rows = await ctx.db
    .query("notifications")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(CAP + 1)
  return summarize(rows)
}

type Series = { ts: number[]; capped: boolean }

async function timestampsSince(
  ctx: QueryCtx,
  table: "checkIns" | "users" | "deathVerification" | "billingEvents",
  since: number,
  cap: number,
): Promise<Series> {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_creation_time", (q) => q.gte("_creationTime", since))
    .take(cap + 1)
  return {
    ts: rows.slice(0, cap).map((r) => r._creationTime),
    capped: rows.length > cap,
  }
}

const seriesShape = v.object({ ts: v.array(v.number()), capped: v.boolean() })

/** Raw event timestamps since the CLIENT-provided cutoff (queries must never
 *  read wall-clock). The client buckets them by local day for the charts. */
export const getActivitySeries = query({
  args: { since: v.number() },
  returns: v.object({
    checkIns: seriesShape,
    newUsers: seriesShape,
    deathReports: seriesShape,
    billing: seriesShape,
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return {
      checkIns: await timestampsSince(ctx, "checkIns", args.since, 2000),
      newUsers: await timestampsSince(ctx, "users", args.since, 1000),
      deathReports: await timestampsSince(ctx, "deathVerification", args.since, 500),
      billing: await timestampsSince(ctx, "billingEvents", args.since, 500),
    }
  },
})

async function countPendingLongstop(ctx: QueryCtx): Promise<Counted> {
  // pendingVerification rows WITH a longstop will AUTO-RELEASE when it fires —
  // the dashboard surfaces them so a human can review before the machine does.
  const rows = await ctx.db
    .query("switchState")
    .withIndex("by_state_and_nextDeadlineAt", (q) =>
      q.eq("state", "pendingVerification"),
    )
    .take(CAP + 1)
  const withLongstop = rows.filter(
    (r) => r.longstopMs !== undefined && r.pendingVerificationStartedAt !== undefined,
  )
  return { value: Math.min(withLongstop.length, CAP), capped: rows.length > CAP }
}

export const getMetrics = query({
  args: {},
  returns: v.object({
    users: countShape,
    switch: v.object({
      active: countShape,
      grace: countShape,
      pendingVerification: countShape,
      released: countShape,
      paused: countShape,
    }),
    pendingLongstop: countShape,
    entitlements: v.object({
      trialing: countShape,
      active: countShape,
      past_due: countShape,
      canceled: countShape,
      expired: countShape,
    }),
    deathCases: v.object({
      under_review: countShape,
      approved: countShape,
      rejected: countShape,
    }),
    notifications: v.object({ pending: countShape, failed: countShape }),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return {
      users: summarize(await ctx.db.query("users").take(CAP + 1)),
      switch: {
        active: await countSwitch(ctx, "active"),
        grace: await countSwitch(ctx, "grace"),
        pendingVerification: await countSwitch(ctx, "pendingVerification"),
        released: await countSwitch(ctx, "released"),
        paused: await countSwitch(ctx, "paused"),
      },
      pendingLongstop: await countPendingLongstop(ctx),
      entitlements: {
        trialing: await countEntitlement(ctx, "trialing"),
        active: await countEntitlement(ctx, "active"),
        past_due: await countEntitlement(ctx, "past_due"),
        canceled: await countEntitlement(ctx, "canceled"),
        expired: await countEntitlement(ctx, "expired"),
      },
      deathCases: {
        under_review: await countDeathCases(ctx, "under_review"),
        approved: await countDeathCases(ctx, "approved"),
        rejected: await countDeathCases(ctx, "rejected"),
      },
      notifications: {
        pending: await countNotifications(ctx, "pending"),
        failed: await countNotifications(ctx, "failed"),
      },
    }
  },
})
