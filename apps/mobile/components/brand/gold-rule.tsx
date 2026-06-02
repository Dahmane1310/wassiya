import { Separator } from "@workspace/ui-native/components/ui/separator"
import { cn } from "@workspace/ui-native/lib/utils"

type GoldRuleProps = {
  className?: string
}

/** A short metallic-gold divider used under the wordmark for a premium accent. */
export function GoldRule({ className }: GoldRuleProps) {
  return (
    <Separator
      className={cn("bg-gold h-[2px] w-12 self-center rounded-full", className)}
    />
  )
}
