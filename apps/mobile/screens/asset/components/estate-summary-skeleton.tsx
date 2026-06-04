import { View } from "react-native"
import { Skeleton } from "@workspace/ui-native/components/ui/skeleton"

/** Placeholder for the estate hero while the list decrypts. */
export function EstateSummarySkeleton() {
  return (
    <View className="gap-4 rounded-xl bg-card p-6 shadow-sm shadow-black/5">
      <Skeleton className="h-3 w-24 rounded-md" />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-px w-full" />
      <View className="flex-row gap-6">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </View>
    </View>
  )
}
