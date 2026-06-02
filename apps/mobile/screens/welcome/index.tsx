import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { StatusBar } from "expo-status-bar"
import { BrandedSplash } from "@/screens/welcome/components/branded-splash"
import { PostSignInHandoff } from "@/screens/welcome/components/post-sign-in-handoff"
import { Welcome } from "@/screens/welcome/components/welcome"

// The first screen: an adaptive (light + dark, EN + AR) branded entry point that
// routes by auth state. The surface is bg-background/text-foreground; teal + gold
// appear only as accents, so the StatusBar can follow the system appearance.
export function WelcomeScreen() {
  return (
    <>
      <StatusBar style="auto" />
      <AuthLoading>
        <BrandedSplash />
      </AuthLoading>
      <Unauthenticated>
        <Welcome />
      </Unauthenticated>
      <Authenticated>
        <PostSignInHandoff />
      </Authenticated>
    </>
  )
}
