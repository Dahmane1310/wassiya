import {
  Spectral,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Reem_Kufi,
} from "next/font/google"

import "@workspace/ui/globals.css"
import "./globals.css"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

// Beneficiary-portal type system (Claude Design handoff): Spectral serif for
// legacy/headings, Plus Jakarta Sans for UI, JetBrains Mono for ciphertext,
// Reem Kufi for Arabic. Exposed as CSS variables consumed by app/globals.css.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
})
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-reem",
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
        spectral.variable,
        jakarta.variable,
        jetbrains.variable,
        reemKufi.variable,
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
