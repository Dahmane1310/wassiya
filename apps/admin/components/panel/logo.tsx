// The unified Wassiya W-square placeholder mark — same spec as
// apps/web/components/portal/logo.tsx and the mobile/landing marks.
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      aria-label="Wassiya"
      className="flex shrink-0 items-center justify-center font-extrabold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        // Shared brand tokens — dark-mode aware for free.
        background: "linear-gradient(160deg, var(--gold), var(--gold-deep))",
        fontSize: size * 0.52,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      W
    </div>
  )
}
