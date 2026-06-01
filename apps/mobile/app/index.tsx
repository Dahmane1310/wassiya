import { useState } from "react"
import { ActivityIndicator, Alert, ScrollView, View } from "react-native"
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useAuthStore } from "@/src/stores/auth"

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-6"
      className="bg-background flex-1"
    >
      <View className="gap-1">
        <Text variant="h3">Auth test</Text>
        <Text variant="muted">React Native Reusables · Uniwind</Text>
      </View>
      <AuthLoading>
        <ActivityIndicator />
      </AuthLoading>
      <Unauthenticated>
        <SignedOut />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </ScrollView>
  )
}

function SignedOut() {
  const signIn = useAuthStore((s) => s.signIn)
  const [busy, setBusy] = useState(false)

  async function onSignIn() {
    setBusy(true)
    try {
      await signIn()
    } catch (err) {
      Alert.alert("Sign-in failed", err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="w-full gap-3">
      <Text variant="muted">You are signed out.</Text>
      <Button onPress={onSignIn} disabled={busy}>
        <Text>Sign in</Text>
      </Button>
      {busy ? <ActivityIndicator /> : null}
    </View>
  )
}

function SignedIn() {
  const signOut = useAuthStore((s) => s.signOut)
  // Runs against Convex with the WorkOS token attached. A non-null result is the
  // end-to-end proof that Convex authenticated the request (same as web).
  const me = useQuery(api.users.currentUser)

  return (
    <View className="w-full gap-3">
      <Text variant="muted">Convex sees this identity:</Text>
      <Text variant="code" selectable>
        {me === undefined ? "loading…" : JSON.stringify(me, null, 2)}
      </Text>
      <Button variant="outline" onPress={() => void signOut()}>
        <Text>Sign out</Text>
      </Button>
    </View>
  )
}
