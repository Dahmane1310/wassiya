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
        background: "linear-gradient(160deg, oklch(0.7 0.105 72), oklch(0.58 0.1 66))",
        fontSize: size * 0.52,
        letterSpacing: -0.5,
      }}
    >
      W
    </div>
  )
}
