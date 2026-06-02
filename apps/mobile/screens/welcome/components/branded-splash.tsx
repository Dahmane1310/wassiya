import { ActivityIndicator, View } from "react-native"
import { BrandMark } from "@/components/brand/brand-mark"
import { ScreenContainer } from "@/components/layout/screen-container"

/**
 * Shown while auth tokens hydrate. No Text on purpose — it renders before fonts
 * could matter and we don't want a system→brand font flash.
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
