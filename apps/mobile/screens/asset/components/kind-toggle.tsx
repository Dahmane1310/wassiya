import { Pressable, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { type AssetKind } from "@/lib/asset-crypto"

const OPTIONS: readonly AssetKind[] = ["asset", "debt"]

/** Asset vs debt segmented toggle. Debt is first-class (settled first, off the
 *  top of the estate), not a mere category. */
export function KindToggle({
  value,
  onChange,
}: {
  value: AssetKind
  onChange: (kind: AssetKind) => void
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()

  return (
    <View className="flex-row gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              "flex-1 items-center rounded-md py-2",
              active && "bg-background"
            )}
          >
            <Text
              className={cn(
                "text-sm",
                active ? "text-foreground" : "text-muted-foreground",
                body
              )}
            >
              {t(opt === "asset" ? "asset.form.kindAsset" : "asset.form.kindDebt")}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
