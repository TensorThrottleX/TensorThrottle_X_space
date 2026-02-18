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
  title: {
    template: 'TensorThrottle_X_space | %s',
    default: 'TensorThrottle_X_space',
  },
  description: 'A production-ready portfolio powered by Notion and Next.js',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <UIProvider>
          <MediaEngineProvider>
            <RenderScaler>
              {/* Desktop-only fixed elements — hidden on mobile via CSS */}
              <div className="desktop-only">
                <SystemClock />
                <TrademarkLogo />
              </div>
              <main className="app-root relative z-10">
                {children}
              </main>
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
