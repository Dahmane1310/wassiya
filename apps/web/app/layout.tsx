import { Inter, JetBrains_Mono, Tajawal } from "next/font/google"

import "@workspace/ui/globals.css"
import "./globals.css"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
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
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
