import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from "next/font/google";

import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'TensorThrottleX Space | Digital Laboratory',
  description: 'An operational layer for deep technical exploration, mapping unshaped ideas into structured systems.',
  icons: {
    icon: '/media/brand/logo.png',
    shortcut: '/media/brand/logo.png',
    apple: '/media/brand/logo.png',
    other: [
      {
        rel: 'icon',
        url: '/media/brand/favicon.ico',
      },
    ],
  },
}


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // CSS clamp()-based scaling handles proportional sizing across all viewports.
  // No need for fixed 1920px — the layout scales via rem units.
  themeColor: '#000000',
}

import { UIProvider } from "@/components/providers/UIProvider"
import { MediaEngineProvider } from "@/components/providers/MediaProvider"

import { TrademarkLogo } from "@/components/dashboard/TrademarkLogo"
import { GlobalFooter } from "@/components/layout/GlobalFooter"
import { SystemClock } from "@/components/dashboard/SystemClock"
import { RenderScaler } from "@/components/layout/RenderScaler"
import { LabNavigation } from "@/components/layout/LabNavigation"
import { RightFloatingBar } from "@/components/layout/RightFloatingBar"
import { BootLoader } from "@/components/visuals/BootLoader"

import { GlobalMessageOverlay } from "@/components/layout/GlobalMessageOverlay"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alfa+Slab+One&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Bitcount+Grid+Single:wght@100..900&family=Bitcount+Single+Ink:wght@100..900&family=Bitcount:wght@100..900&family=Caveat:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased mode-bright">
        <UIProvider>
          <MediaEngineProvider>
            <BootLoader />
            <TrademarkLogo />
            <RenderScaler>
              {/* Desktop-only fixed elements — hidden on mobile via CSS */}
              <div className="desktop-only">
                <SystemClock />
              </div>
              <LabNavigation />
              <RightFloatingBar />

              <main className="app-root relative z-10">
                {children}
              </main>

              <GlobalMessageOverlay />

              <div className="desktop-only">
                <GlobalFooter />
              </div>
            </RenderScaler>
          </MediaEngineProvider>
        </UIProvider>
      </body>
    </html>
  )
}
