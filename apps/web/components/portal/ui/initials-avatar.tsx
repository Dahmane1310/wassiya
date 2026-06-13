"use client"

type Props = {
  initials: string
  /** CSS color (token var) driving the tint — see format.ts tintFor. */
  tint?: string
  size?: number
  ring?: boolean
  dim?: boolean
}

/** Deterministically tinted initials avatar. Mixes against var(--card) so
 *  dark mode adapts (the old version mixed against literal white). */
export function InitialsAvatar({ initials, tint = "var(--primary)", size = 44, ring, dim }: Props) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklch, ${tint} ${dim ? 8 : 16}%, var(--card))`,
        color: tint,
        border: ring ? `2.5px solid ${tint}` : "none",
        fontSize: size * 0.36,
        letterSpacing: -0.3,
        opacity: dim ? 0.55 : 1,
      }}
    >
      {initials}
    </div>
  )
}
