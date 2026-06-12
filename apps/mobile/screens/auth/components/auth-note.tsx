import { View } from "react-native"
import { CircleAlert, CircleCheck } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"

type AuthNoteProps = {
  tone: "error" | "success"
  children: string
}

/** Inline feedback under an auth form: a soft tinted row with an icon, instead
 *  of a bare red line — readable and calm, matching the app's pill language. */
export function AuthNote({ tone, children }: AuthNoteProps) {
  const { body } = useBrandType()
  const error = tone === "error"
  return (
    <View
      className={cn(
        "flex-row items-center gap-2.5 rounded-xl px-3.5 py-2.5",
        error ? "bg-red-soft" : "bg-green-soft"
      )}
    >
      <Icon
        as={error ? CircleAlert : CircleCheck}
        size={16}
        className={error ? "text-danger" : "text-green"}
      />
      <Text
        className={cn(
          "flex-1 text-[13px] leading-snug",
          body,
          error ? "text-danger" : "text-green"
        )}
      >
        {children}
      </Text>
    </View>
  )
}
