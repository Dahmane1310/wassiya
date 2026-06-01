import { Redirect } from "expo-router"

// The WorkOS redirect (convexstarter://callback?code=…) is captured by the
// in-app auth session in src/lib/auth.ts. If the OS also delivers the deep link
// to the router, land here and bounce home instead of showing "Unmatched route".
export default function Callback() {
  return <Redirect href="/" />
}
