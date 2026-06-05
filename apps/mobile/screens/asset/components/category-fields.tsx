import { TextInput } from "react-native"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui-native/lib/utils"
import { Field } from "@/components/ui/field"
import { useThemeColors } from "@/lib/colors"
import { ASSET_FIELDS, CATEGORY_FIELDS } from "@/lib/asset-fields"
import { type AssetCategory } from "@/lib/asset-crypto"

// Re-exported so existing asset-form imports keep resolving from one place.
export { Field }

/** Renders the category-specific fields (adapts to house / car / bank / …),
 *  bound to a `details` map. Sensitive fields render mono. */
export function CategoryFields({
  category,
  details,
  onChange,
}: {
  category: AssetCategory
  details: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const { t } = useTranslation()
  const c = useThemeColors()
  const keys = CATEGORY_FIELDS[category]

  return (
    <>
      {keys.map((key) => {
        const def = ASSET_FIELDS[key]!
        return (
          <Field key={key} label={t(`assetFields.${key}`)} tall={def.multiline}>
            <TextInput
              value={details[key] ?? ""}
              onChangeText={(v) => onChange(key, v)}
              placeholder={t(`assetFields.${key}_ph`)}
              placeholderTextColor={c.ink3}
              keyboardType={def.numeric ? "numeric" : "default"}
              multiline={def.multiline}
              textAlignVertical={def.multiline ? "top" : "center"}
              autoCapitalize={def.sensitive ? "none" : "sentences"}
              autoCorrect={!def.sensitive}
              className={cn(
                "h-full flex-1 text-foreground",
                def.sensitive ? "font-mono text-[14px]" : "font-sans text-[15.5px]",
                def.multiline && "py-3"
              )}
            />
          </Field>
        )
      })}
    </>
  )
}
