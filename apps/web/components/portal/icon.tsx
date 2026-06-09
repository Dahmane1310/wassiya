import type { CSSProperties, ReactNode } from "react"

// Line-icon set ported from the Wassiya Design handoff (core.jsx). currentColor
// stroke, 24x24 viewbox. Add new glyphs here as screens need them.
const P = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

const PATHS: Record<string, (sw: number) => ReactNode> = {
  home: (sw) => (<><path d="M4 11.2 12 4l8 7.2" {...P} strokeWidth={sw} /><path d="M5.6 9.8V20h12.8V9.8" {...P} strokeWidth={sw} /><path d="M10 20v-5h4v5" {...P} strokeWidth={sw} /></>),
  key: (sw) => (<><circle cx="8" cy="8" r="3.6" {...P} strokeWidth={sw} /><path d="M10.6 10.6 20 20" {...P} strokeWidth={sw} /><path d="M16.5 16.5 18.5 14.5M19 19l1.6-1.6" {...P} strokeWidth={sw} /></>),
  shield: (sw) => (<path d="M12 3.4c2.4 1.6 4.6 2.2 7 2.4v6.2c0 5-3.6 7.6-7 9-3.4-1.4-7-4-7-9V5.8c2.4-.2 4.6-.8 7-2.4z" {...P} strokeWidth={sw} />),
  shieldCheck: (sw) => (<><path d="M12 3.4c2.4 1.6 4.6 2.2 7 2.4v6.2c0 5-3.6 7.6-7 9-3.4-1.4-7-4-7-9V5.8c2.4-.2 4.6-.8 7-2.4z" {...P} strokeWidth={sw} /><path d="M9 11.8l2.1 2.1L15.2 9.8" {...P} strokeWidth={sw} /></>),
  lock: (sw) => (<><rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.4" {...P} strokeWidth={sw} /><path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8" {...P} strokeWidth={sw} /><circle cx="12" cy="15" r="1.3" {...P} strokeWidth={sw} /></>),
  lockOpen: (sw) => (<><rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.4" {...P} strokeWidth={sw} /><path d="M8 10.4V7.6a4 4 0 0 1 7.6-1.8" {...P} strokeWidth={sw} /><circle cx="12" cy="15" r="1.3" {...P} strokeWidth={sw} /></>),
  fingerprint: (sw) => (<><path d="M12 4.4a7.6 7.6 0 0 1 7.6 7.6v1.4" {...P} strokeWidth={sw} /><path d="M4.4 13.4V12A7.6 7.6 0 0 1 8 5.6" {...P} strokeWidth={sw} /><path d="M8 12a4 4 0 0 1 8 0v2a8 8 0 0 1-.6 3" {...P} strokeWidth={sw} /><path d="M12 12v2.4a8 8 0 0 1-1.6 4.8" {...P} strokeWidth={sw} /><path d="M6.6 18.4A8 8 0 0 0 8 14v-2" {...P} strokeWidth={sw} /></>),
  pulse: (sw) => (<path d="M2.5 12h4l2-6 3.5 12 2.5-9 1.6 3H21.5" {...P} strokeWidth={sw} />),
  clock: (sw) => (<><circle cx="12" cy="12" r="8.4" {...P} strokeWidth={sw} /><path d="M12 7.4V12l3 2" {...P} strokeWidth={sw} /></>),
  file: (sw) => (<><path d="M6 3.4h7.2L18.6 8v11.4a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4.6A1.2 1.2 0 0 1 6 3.4z" {...P} strokeWidth={sw} /><path d="M13 3.6V8h4.4" {...P} strokeWidth={sw} /></>),
  doc: (sw) => (<><path d="M6 3.4h7.2L18.6 8v11.4a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4.6A1.2 1.2 0 0 1 6 3.4z" {...P} strokeWidth={sw} /><path d="M13 3.6V8h4.4" {...P} strokeWidth={sw} /><path d="M8.4 12.4h7M8.4 15.6h7" {...P} strokeWidth={sw} /></>),
  bell: (sw) => (<><path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0c0 4.4 1.4 5.6 2 6.4H4.4c.6-.8 2-2 2-6.4z" {...P} strokeWidth={sw} /><path d="M10 19a2 2 0 0 0 4 0" {...P} strokeWidth={sw} /></>),
  bank: (sw) =>(<><path d="M4 9.5 12 4l8 5.5" {...P} strokeWidth={sw} /><path d="M5 9.8h14" {...P} strokeWidth={sw} /><path d="M6.5 10v7M10 10v7M14 10v7M17.5 10v7" {...P} strokeWidth={sw} /><path d="M4 20h16" {...P} strokeWidth={sw} /></>),
  coins: (sw) => (<><ellipse cx="9" cy="7" rx="5.5" ry="2.6" {...P} strokeWidth={sw} /><path d="M3.5 7v4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V7" {...P} strokeWidth={sw} /><path d="M9 13.6v3.8c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-7" {...P} strokeWidth={sw} /><ellipse cx="14.5" cy="9.8" rx="5.5" ry="2.6" {...P} strokeWidth={sw} /></>),
  car: (sw) => (<><path d="M3.5 13.5 5 8.6A2 2 0 0 1 6.9 7.2h10.2A2 2 0 0 1 19 8.6l1.5 4.9" {...P} strokeWidth={sw} /><path d="M3.5 13.5h17v3.8a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1v-.8H7v.8a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-3.8z" {...P} strokeWidth={sw} /><path d="M6.5 16h.01M17.5 16h.01" {...P} strokeWidth={sw} /></>),
  bitcoin: (sw) => (<><circle cx="12" cy="12" r="8.4" {...P} strokeWidth={sw} /><path d="M9.6 8h3.6a2 2 0 0 1 0 4H9.6m0 0h4a2 2 0 0 1 0 4H9.6m0-8v8m0-8V6.4m0 9.6v1.6m2.4-11.2V6.4m0 9.6v1.6" {...P} strokeWidth={sw} /></>),
  check: (sw) => (<path d="M5 12.5 10 17.5 19.5 7" {...P} strokeWidth={sw} />),
  chevR: (sw) => (<path d="M9 5l7 7-7 7" {...P} strokeWidth={sw} />),
  chevL: (sw) => (<path d="M15 5l-7 7 7 7" {...P} strokeWidth={sw} />),
  chevD: (sw) => (<path d="M5 9l7 7 7-7" {...P} strokeWidth={sw} />),
  x: (sw) => (<path d="M6 6l12 12M18 6 6 18" {...P} strokeWidth={sw} />),
  eye: (sw) => (<><path d="M2.4 12S5.6 6 12 6s9.6 6 9.6 6-3.2 6-9.6 6-9.6-6-9.6-6z" {...P} strokeWidth={sw} /><circle cx="12" cy="12" r="2.8" {...P} strokeWidth={sw} /></>),
  eyeOff: (sw) => (<><path d="M4 4l16 16" {...P} strokeWidth={sw} /><path d="M9.6 5.6A9.6 9.6 0 0 1 12 6c6.4 0 9.6 6 9.6 6a14 14 0 0 1-2.6 3.2M6.4 8A14 14 0 0 0 2.4 12s3.2 6 9.6 6a9 9 0 0 0 3-.5" {...P} strokeWidth={sw} /><path d="M9.8 9.9A2.8 2.8 0 0 0 14 14" {...P} strokeWidth={sw} /></>),
  info: (sw) => (<><circle cx="12" cy="12" r="8.4" {...P} strokeWidth={sw} /><path d="M12 11v5M12 7.8h.01" {...P} strokeWidth={sw} /></>),
  alert: (sw) => (<><path d="M12 3.6 21 19H3l9-15.4z" {...P} strokeWidth={sw} /><path d="M12 9.6v4M12 16.6h.01" {...P} strokeWidth={sw} /></>),
  mail: (sw) => (<><rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.4" {...P} strokeWidth={sw} /><path d="m4 7 8 5.4L20 7" {...P} strokeWidth={sw} /></>),
  phone: (sw) => (<path d="M6.6 4.4 9 4.8l1 3.4-1.7 1.5a11 11 0 0 0 4.6 4.6l1.5-1.7 3.4 1 .4 2.4a1.6 1.6 0 0 1-1.6 1.9A13.4 13.4 0 0 1 4.7 6.2a1.6 1.6 0 0 1 1.9-1.8z" {...P} strokeWidth={sw} />),
  upload: (sw) => (<><path d="M12 15V4M8 8l4-4 4 4" {...P} strokeWidth={sw} /><path d="M5 14v3.4A1.6 1.6 0 0 0 6.6 19h10.8a1.6 1.6 0 0 0 1.6-1.6V14" {...P} strokeWidth={sw} /></>),
  download: (sw) => (<><path d="M12 4v11M8 11l4 4 4-4" {...P} strokeWidth={sw} /><path d="M5 19h14" {...P} strokeWidth={sw} /></>),
  copy: (sw) => (<><rect x="8" y="8" width="12" height="12" rx="2.2" {...P} strokeWidth={sw} /><path d="M16 8V5.6A1.6 1.6 0 0 0 14.4 4H5.6A1.6 1.6 0 0 0 4 5.6v8.8A1.6 1.6 0 0 0 5.6 16H8" {...P} strokeWidth={sw} /></>),
  logout: (sw) => (<><path d="M14 7V5.2A1.6 1.6 0 0 0 12.4 3.6H5.6A1.6 1.6 0 0 0 4 5.2v13.6a1.6 1.6 0 0 0 1.6 1.6h6.8a1.6 1.6 0 0 0 1.6-1.6V17" {...P} strokeWidth={sw} /><path d="M10 12h10M17 9l3 3-3 3" {...P} strokeWidth={sw} /></>),
  refresh: (sw) => (<><path d="M4.6 9a7.6 7.6 0 0 1 13-2.6L20 8.4M20 4.4v4h-4" {...P} strokeWidth={sw} /><path d="M19.4 15a7.6 7.6 0 0 1-13 2.6L4 15.6M4 19.6v-4h4" {...P} strokeWidth={sw} /></>),
  user: (sw) => (<><circle cx="12" cy="8" r="3.6" {...P} strokeWidth={sw} /><path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6" {...P} strokeWidth={sw} /></>),
  arrowR: (sw) => (<path d="M4 12h15M13 6l6 6-6 6" {...P} strokeWidth={sw} />),
  grid: (sw) => (<><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" {...P} strokeWidth={sw} /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" {...P} strokeWidth={sw} /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" {...P} strokeWidth={sw} /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" {...P} strokeWidth={sw} /></>),
  card: (sw) => (<><rect x="3" y="5.4" width="18" height="13.2" rx="2.6" {...P} strokeWidth={sw} /><path d="M3 9.6h18" {...P} strokeWidth={sw} /><path d="M6.6 14.4h3" {...P} strokeWidth={sw} /></>),
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 20,
  sw = 1.7,
  className = "",
  style = {},
}: {
  name: IconName
  size?: number
  sw?: number
  className?: string
  style?: CSSProperties
}) {
  const draw = PATHS[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      fill="none"
    >
      {draw ? draw(sw) : null}
    </svg>
  )
}
