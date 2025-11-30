import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { SwRegister } from "@/components/sw-register"

const _inter = Inter({ subsets: ["latin"] })
const _merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Virulen - Learn English by Scanning",
  description: "Learn English vocabulary by scanning objects around you",
  manifest: "/manifest.json"
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7a9a5a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Vosk-browser CDN for in-browser speech recognition */}
        <script
          src="https://cdn.jsdelivr.net/npm/vosk-browser@0.0.3/dist/vosk.js"
          defer
        />
      </head>
      <body className="font-sans antialiased">
        <SwRegister />
        {children}
      </body>
    </html>
  )
}
