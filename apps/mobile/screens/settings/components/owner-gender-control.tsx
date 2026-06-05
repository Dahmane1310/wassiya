import { Pressable, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Scale } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useThemeColors } from "@/lib/colors"

/** Owner (deceased) gender — required by the Fara'id engine for the spouse share.
 *  A Male/Female segmented control wired to `setOwnerGender`. */
export function OwnerGenderControl() {
  const { t } = useTranslation()
  const c = useThemeColors()
  const currentUser = useQuery(api.users.currentUser)
  const setOwnerGender = useMutation(api.users.setOwnerGender)
  const value = currentUser?.ownerGender ?? null

  return (
    <View className="flex-row items-center gap-3 px-3.5 py-3">
      <View
        style={{ backgroundColor: c.goldDeep + "1f" }}
        className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
      >
        <Icon as={Scale} size={18} className="text-gold-deep" />
      </View>
      <Text className="flex-1 font-sans-semibold text-[15px] text-foreground">{t("profile.ownerGender")}</Text>
      <View className="flex-row gap-1 rounded-xl bg-surface-3 p-1">
        {(["male", "female"] as const).map((g) => {
          const on = value === g
          return (
            <Pressable
              key={g}
              onPress={() => void setOwnerGender({ gender: g })}
              className={cn(
                "h-[34px] items-center justify-center rounded-lg px-3.5 active:opacity-80",
                on && "bg-card shadow-sm shadow-black/5"
              )}
            >
              <Text className={cn("font-heading text-[13.5px]", on ? "text-foreground" : "text-ink-3")}>
                {t(`gender.${g}`)}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
