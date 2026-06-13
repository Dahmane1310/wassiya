import { Inter, JetBrains_Mono, Tajawal } from "next/font/google"
import Script from "next/script"

import "@workspace/ui/globals.css"
import "./globals.css"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LangProvider } from "@/components/lang-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

// Wassiya brand type system (shared with mobile and landing): Inter for Latin
// UI and headings, Tajawal for Arabic, JetBrains Mono for ciphertext. Exposed
// as CSS variables consumed by app/globals.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })
// Tajawal is not a variable font — weights must be listed explicitly.
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
        inter.variable,
        jetbrains.variable,
        tajawal.variable,
      )}
    >
      <body>
        {/* No-flash language boot: apply the saved lang/dir before first paint
            (LangProvider re-syncs React state after hydration). */}
        <Script id="lang-boot" strategy="beforeInteractive">
          {`try{var l=localStorage.getItem("wassiya_web_lang");if(l==="ar"||l==="en"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr"}}catch(e){}`}
        </Script>
        <ThemeProvider>
          <LangProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </LangProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
