import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from "@workspace/ui-native/components/ui/select"
import { ASSET_CATEGORIES } from "@/lib/asset-categories"
import { type AssetCategory } from "@/lib/asset-crypto"

/** Category picker. The option `value` is the stable category key; the visible
 *  label is translated (and RTL-flipped) via i18n. */
export function CategorySelect({
  value,
  onChange,
}: {
  value: AssetCategory
  onChange: (category: AssetCategory) => void
}) {
  const { t } = useTranslation()
  const selected: Option = value
    ? { value, label: t(`asset.category.${value}`) }
    : undefined

  return (
    <Select
      value={selected}
      onValueChange={(option) => {
        if (option) onChange(option.value as AssetCategory)
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={t("asset.form.categoryPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {ASSET_CATEGORIES.map((category) => (
          <SelectItem
            key={category}
            value={category}
            label={t(`asset.category.${category}`)}
          />
        ))}
      </SelectContent>
    </Select>
  )
}
