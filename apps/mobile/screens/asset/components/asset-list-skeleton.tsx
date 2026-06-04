import { View } from "react-native"
import { Skeleton } from "@workspace/ui-native/components/ui/skeleton"

/** Placeholder rows shown while the asset list query resolves. */
export function AssetListSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </View>
  )
}
