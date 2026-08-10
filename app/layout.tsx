import React from "react"
import type { Metadata, Viewport } from 'next'

import './globals.css'

const inter = { className: "font-sans" };

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
import { MediaOrchestrator } from "@/components/providers/MediaOrchestrator"

import { TrademarkLogo } from "@/components/dashboard/TrademarkLogo"
import { GlobalFooter } from "@/components/layout/GlobalFooter"
import { SystemClock } from "@/components/dashboard/SystemClock"
import { RenderScaler } from "@/components/layout/RenderScaler"
import { TopFloatingBar } from "@/components/navigation/TopFloatingBar"
import { MobileNavbar } from "@/components/navigation/MobileNavbar"
import { BottomFloatingBar } from "@/components/layout/BottomFloatingBar"
import { SystemCoreOrb } from "@/components/dashboard/SystemCoreOrb"
import { AppStartupGate } from "@/components/layout/AppStartupGate"
import { LiveTrafficStats } from "@/components/dashboard/LiveTrafficStats"

import { GlobalMessageOverlay } from "@/components/layout/GlobalMessageOverlay"
import { GlobalTerminalRenderer } from "@/components/layout/GlobalTerminalRenderer"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { PulseBell } from "@/components/pulse/PulseBell"
import { FoxProvider } from "@/fox-companion"
import { DiscussionProvider } from "@/components/providers/DiscussionProvider"
import { GlobalDiscussionOverlay } from "@/components/layout/GlobalDiscussionOverlay"
import { DiscussionEntry } from "@/components/pulse/DiscussionEntry"

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
        <link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alfa+Slab+One&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Bitcount+Grid+Single:wght@100..900&family=Bitcount+Single+Ink:wght@100..900&family=Bitcount:wght@100..900&family=Caveat:wght@400..700&family=Inter:wght@400;500;600;700;800;900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased mode-bright" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var m=localStorage.getItem('renderMode');if(m==='bright'||m==='dark'){window.__TX_THEME__=m;document.body.className='antialiased mode-'+m;}}catch(e){window.__TX_THEME__='bright';}})()`
        }} />
        <UIProvider>
          <MediaOrchestrator>
            <DiscussionProvider>
              <FoxProvider>

              <RenderScaler>
                <SystemCoreOrb />
                <AppStartupGate>
                  {/* Traffic Stats: Desktop top-left mirror, Mobile top-left */}
                  <div className="fixed top-6 left-6 z-[150] lg:inset-x-0 lg:top-[96px] lg:left-auto lg:flex lg:justify-start pointer-events-none xl:top-1 xl:h-[76px] xl:items-center xl:pl-12">
                    <div className="flex items-center gap-5 pointer-events-auto">
                      <LiveTrafficStats />
                    </div>
                  </div>

                  <div className="desktop-only">
                    <div className="fixed inset-x-0 top-1 z-[150] flex justify-center pointer-events-none">
                      <TopFloatingBar />
                    </div>
                  </div>

                  <div className="desktop-only">
                    <div className="fixed inset-x-0 top-[96px] z-[150] flex justify-end pointer-events-none xl:top-1 xl:h-[76px] xl:items-center xl:pr-12">
                      <div className="flex items-center gap-5 pointer-events-auto">
                        <DiscussionEntry variant="desktop" />
                        <PulseBell variant="desktop" />
                        <SystemClock />
                      </div>
                    </div>
                  </div>
                  <div className="lg:hidden">
                    <DiscussionEntry variant="mobile" />
                    <PulseBell variant="mobile" />
                  </div>
                  <div className="lg:hidden">
                    <MobileNavbar />
                  </div>
                  <div className="desktop-only">
                    <BottomFloatingBar />
                  </div>

                  <main className="app-root relative z-10">
                    {children}
                  </main>

                  <GlobalMessageOverlay />
                  <GlobalTerminalRenderer />
                  <GlobalDiscussionOverlay />

                  <div className="desktop-only">
                    <GlobalFooter />
                  </div>
                  <div className="lg:hidden">
                    <MobileBottomNav />
                  </div>
                </AppStartupGate>
              </RenderScaler>
            </FoxProvider>
            </DiscussionProvider>
          </MediaOrchestrator>
        </UIProvider>
      </body>
    </html>
  )
}
