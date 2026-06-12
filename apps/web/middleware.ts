import { NextRequest } from "next/server"
import { authkit, handleAuthkitProxy } from "@workos-inc/authkit-nextjs"

// Composed AuthKit middleware: session refresh/headers stay AuthKit's, but
// unauthenticated users land on OUR /sign-in page instead of the hosted one.

const PROTECTED_PREFIXES = ["/home", "/account", "/benefactor"]

export default async function middleware(request: NextRequest) {
  const { session, headers } = await authkit(request)
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))

  if (isProtected && !session.user) {
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
