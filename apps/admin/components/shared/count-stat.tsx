/** Renders a bounded count ({value, capped}) — "1000+" when capped. */
export function CountStat({ count }: { count: { value: number; capped: boolean } }) {
  return (
    <>
      {count.value.toLocaleString()}
      {count.capped ? "+" : ""}
    </>
  )
}
