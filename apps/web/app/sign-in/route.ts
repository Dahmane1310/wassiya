import { redirect } from "next/navigation"
import { getSignInUrl } from "@workos-inc/authkit-nextjs"

// `?returnTo=/path` lands the user back where they started after auth (e.g. an
// invite link). AuthKit round-trips it via the callback's returnPathname.
export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo")
  return redirect(await getSignInUrl(returnTo ? { returnTo } : undefined))
}
