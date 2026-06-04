import { View } from "react-native"
import { Card, CardContent } from "@workspace/ui-native/components/ui/card"
import { Skeleton } from "@workspace/ui-native/components/ui/skeleton"

/** Placeholder shown while a single asset loads + decrypts. */
export function AssetDetailSkeleton() {
  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </View>
      </View>
      <Card>
        <CardContent className="gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </View>
  )
}
