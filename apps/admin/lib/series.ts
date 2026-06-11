// Bucketing for the dashboard charts. The backend returns RAW event timestamps
// (queries can't read wall-clock); we group them into LOCAL-day buckets here so
// the chart is timezone-correct, filling every day in range with zeros
// (recharts needs a continuous axis).

export type DayBucket = { date: string; count: number }

function localDayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function bucketByDay(timestamps: number[], days: number): DayBucket[] {
  const counts = new Map<string, number>()
  for (const ts of timestamps) {
    const key = localDayKey(ts)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const out: DayBucket[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = localDayKey(d.getTime())
    out.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return out
}

/** Events within the trailing N days — KPI "this week" deltas. */
export function countLastDays(timestamps: number[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return timestamps.filter((ts) => ts >= cutoff).length
}

/** Merge two bucket series that share the same day range into chart rows. */
export function mergeBuckets(
  a: DayBucket[],
  b: DayBucket[],
  aKey: string,
  bKey: string,
): Array<{ date: string } & Record<string, number | string>> {
  return a.map((bucket, i) => ({
    date: bucket.date,
    [aKey]: bucket.count,
    [bKey]: b[i]?.count ?? 0,
  }))
}
