// PLACEHOLDER logo — a rounded-square "W" monogram. The real Wassiya mark drops in
// here later by editing only this file. Not the pearl from the mockup (per request).
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div
      aria-label="Wassiya"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        flexShrink: 0,
        background: "linear-gradient(160deg, var(--gold), var(--gold-deep))",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.52,
        letterSpacing: -0.5,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      W
    </div>
  )
}

/** Logo + wordmark lockup used in nav/brand panels. */
export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <Logo size={size} />
      <span className="serif" style={{ fontSize: size * 0.59, fontWeight: 600, letterSpacing: -0.2 }}>
        Wassiya
      </span>
    </span>
  )
}
