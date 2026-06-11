import { ActivityIndicator, View } from "react-native"
import { BrandMark } from "@/components/brand/brand-mark"
import { ScreenContainer } from "@/components/layout/screen-container"

/**
 * Shown while auth tokens hydrate. The root layout gates rendering on fonts
 * being loaded, so the BrandMark's "W" glyph is safe from a system→brand font
 * flash here.
 */
export function BrandedSplash() {
  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-6">
        <BrandMark size={88} />
        <ActivityIndicator />
      </View>
    </ScreenContainer>
  )
}
