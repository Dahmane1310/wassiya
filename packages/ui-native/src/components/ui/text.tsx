import { cn } from "@workspace/ui-native/lib/utils"
import { Slot } from "@rn-primitives/slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { I18nManager, Platform, Text as RNText, type Role } from "react-native"

// Arabic (Tajawal) faces — see global.css @theme. The Latin families (Inter) have
// no Arabic glyphs, so under RTL EVERY text must be routed through Tajawal, not just
// the few components that call useBrandType. We remap the family utility on the
// final className here — one place, so all text is consistently Arabic.
const AR_BOLD = "font-display-ar-bold" // Tajawal_700Bold
const AR_MEDIUM = "font-display-ar" // Tajawal_500Medium
const AR_REGULAR = "font-body-ar" // Tajawal_400Regular

// Map each Latin family utility to a Tajawal weight. `font-mono` is intentionally
// absent: it carries digits/ciphertext (ASCII), which JetBrains Mono renders fine
// and keeps aligned, so it's left untouched.
const AR_WEIGHT: Record<string, string> = {
  "font-heading-bold": AR_BOLD,
  "font-display-bold": AR_BOLD,
  "font-display": AR_BOLD,
  "font-heading": AR_BOLD,
  "font-sans-semibold": AR_MEDIUM,
  "font-sans-medium": AR_MEDIUM,
  "font-sans": AR_REGULAR,
}

/** Replace any Inter family utility in `cls` with the matching Tajawal one (RTL
 *  only). Last family wins, mirroring how the style is actually resolved. */
function toArabicFont(cls: string): string {
  const tokens = cls.split(/\s+/).filter(Boolean)
  const rest: string[] = []
  let weight: string | null = null
  for (const tk of tokens) {
    if (tk in AR_WEIGHT) weight = AR_WEIGHT[tk]!
    else rest.push(tk)
  }
  const alreadyArabic = rest.some((t) => t === AR_BOLD || t === AR_MEDIUM || t === AR_REGULAR)
  if (weight) rest.push(weight)
  else if (!alreadyArabic && !rest.includes("font-mono")) rest.push(AR_REGULAR)
  return rest.join(" ")
}

const textVariants = cva(
  cn(
    // `font-sans` resolves to the loaded Inter Regular family (see global.css
    // @theme + app/_layout.tsx useFonts); falls back to system font if unloaded.
    "font-sans text-base text-foreground",
    Platform.select({
      web: "select-text",
    })
  ),
  {
    variants: {
      variant: {
        default: "",
        // Headings use the heavy Inter families (font-heading*). On React Native a
        // bare font-weight class does NOT pick the bold font file — the family must
        // carry the weight — so we map to the explicit family utilities here.
        h1: cn(
          "font-heading-bold text-center text-4xl tracking-tight",
          Platform.select({ web: "scroll-m-20 text-balance" })
        ),
        h2: cn(
          "border-b border-border pb-2 font-heading text-3xl tracking-tight",
          Platform.select({ web: "scroll-m-20 first:mt-0" })
        ),
        h3: cn(
          "font-heading text-2xl tracking-tight",
          Platform.select({ web: "scroll-m-20" })
        ),
        h4: cn(
          "font-heading text-xl tracking-tight",
          Platform.select({ web: "scroll-m-20" })
        ),
        p: "mt-3 leading-7 sm:mt-6",
        blockquote: "mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6",
        code: cn(
          "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        ),
        lead: "text-xl text-muted-foreground",
        large: "font-sans-semibold text-lg",
        small: "font-sans-medium text-sm leading-none",
        muted: "text-sm text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type TextVariantProps = VariantProps<typeof textVariants>

type TextVariant = NonNullable<TextVariantProps["variant"]>

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  blockquote: Platform.select({ web: "blockquote" as Role }),
  code: Platform.select({ web: "code" as Role }),
}

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: "1",
  h2: "2",
  h3: "3",
  h4: "4",
}

const TextClassContext = React.createContext<string | undefined>(undefined)

function Text({
  className,
  asChild = false,
  variant = "default",
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean
  }) {
  const textClass = React.useContext(TextClassContext)
  const Component = asChild ? Slot : RNText
  const merged = cn(textVariants({ variant }), textClass, className)
  return (
    <Component
      className={I18nManager.isRTL ? toArabicFont(merged) : merged}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  )
}

export { Text, TextClassContext }
