import { TextClassContext } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Platform, Pressable } from "react-native"

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none",
    Platform.select({
      web: "whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary shadow-sm shadow-black/5 active:bg-primary/90",
          Platform.select({ web: "hover:bg-primary/90" })
        ),
        destructive: cn(
          "bg-destructive shadow-sm shadow-black/5 active:bg-destructive/90 dark:bg-destructive/60",
          Platform.select({
            web: "hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          })
        ),
        outline: cn(
          "border border-border bg-background shadow-sm shadow-black/5 active:bg-accent dark:border-input dark:bg-input/30 dark:active:bg-input/50",
          Platform.select({
            web: "hover:bg-accent dark:hover:bg-input/50",
          })
        ),
        secondary: cn(
          "bg-secondary shadow-sm shadow-black/5 active:bg-secondary/80",
          Platform.select({ web: "hover:bg-secondary/80" })
        ),
        ghost: cn(
          "active:bg-accent dark:active:bg-accent/50",
          Platform.select({ web: "hover:bg-accent dark:hover:bg-accent/50" })
        ),
        link: "",
        // Wassiya "Living Vault" additions (design handoff):
        // warm-espresso vault button, bronze/legacy button, soft trust-blue chip.
        vault: cn(
          "bg-vault-2 shadow-sm shadow-black/20 active:bg-vault-2/90",
          Platform.select({ web: "hover:bg-vault-2/90" })
        ),
        gold: cn(
          "bg-gold-deep shadow-sm shadow-black/5 active:bg-gold-deep/90",
          Platform.select({ web: "hover:bg-gold-deep/90" })
        ),
        soft: cn(
          "bg-primary-soft active:bg-primary-soft-2",
          Platform.select({ web: "hover:bg-primary-soft-2" })
        ),
      },
      size: {
        default: cn(
          "h-10 px-4 py-2 sm:h-9",
          Platform.select({ web: "has-[>svg]:px-3" })
        ),
        sm: cn(
          "h-9 gap-1.5 rounded-md px-3 sm:h-8",
          Platform.select({ web: "has-[>svg]:px-2.5" })
        ),
        lg: cn(
          "h-11 rounded-md px-6 sm:h-10",
          Platform.select({ web: "has-[>svg]:px-4" })
        ),
        icon: "h-10 w-10 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonTextVariants = cva(
  cn(
    // font-sans-medium = the loaded Inter Medium family (RN needs the family to
    // carry the weight; a bare font-medium won't select it). See global.css @theme.
    "font-sans-medium text-sm text-foreground",
    Platform.select({ web: "pointer-events-none transition-colors" })
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: cn(
          "group-active:text-accent-foreground",
          Platform.select({ web: "group-hover:text-accent-foreground" })
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({
            web: "underline-offset-4 group-hover:underline hover:underline",
          })
        ),
        vault: "text-white",
        gold: "text-white",
        soft: "text-primary",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          props.disabled && "opacity-50",
          buttonVariants({ variant, size }),
          className
        )}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export { Button, buttonTextVariants, buttonVariants }
export type { ButtonProps }
