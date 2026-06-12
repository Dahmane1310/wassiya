import { NextRequest } from "next/server"
import { authkit, handleAuthkitProxy } from "@workos-inc/authkit-nextjs"

// Composed AuthKit middleware: the whole panel is protected; unauthenticated
// users land on OUR /sign-in page instead of the hosted WorkOS one.

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/verify-email",
  "/auth/oauth",
  "/callback",
]

export default async function middleware(request: NextRequest) {
  const { session, headers } = await authkit(request)
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

  if (!isPublic && !session.user) {
    const returnTo = encodeURIComponent(path + request.nextUrl.search)
    return handleAuthkitProxy(request, headers, {
      redirect: `/sign-in?returnTo=${returnTo}`,
    })
  }
  return handleAuthkitProxy(request, headers)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
