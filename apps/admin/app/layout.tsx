import { Inter, JetBrains_Mono, Tajawal } from "next/font/google"
import Script from "next/script"

import "@workspace/ui/globals.css"
import "./globals.css"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils";

// Wassiya brand type (shared with mobile/web/landing): Inter + JetBrains Mono,
// with Tajawal swapped in for Arabic via the [dir="rtl"] rule in globals.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Tajawal is not a variable font — explicit weights required.
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        tajawal.variable,
      )}
    >
      <body>
        {/* No-flash language boot: apply the saved lang/dir before first paint
            (LangProvider re-syncs React state after hydration). */}
        <Script id="lang-boot" strategy="beforeInteractive">
          {`try{var l=localStorage.getItem("wassiya_admin_lang");if(l==="ar"||l==="en"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr"}}catch(e){}`}
        </Script>
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
