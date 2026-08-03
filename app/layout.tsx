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

import { GlobalMessageOverlay } from "@/components/layout/GlobalMessageOverlay"
import { GlobalTerminalRenderer } from "@/components/layout/GlobalTerminalRenderer"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { PulseBell } from "@/components/pulse/PulseBell"
import { FoxProvider } from "@/fox-companion"

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
            <FoxProvider>

              <RenderScaler>
                <AppStartupGate>
                  {/* ── Center Header Region ────────────────────────────────────────────
                      Independent fixed container that owns ONLY the Navigation's centering.
                      `justify-center` is viewport-relative, so the nav is dead-center
                      regardless of anything else in the header. The nav never depends on a
                      utility cluster: no shared grid, no spacer, no translate, no margins.
                      Hidden on mobile via CSS (.desktop-only). */}
                  <div className="desktop-only">
                    <div className="fixed inset-x-0 top-1 z-[150] flex justify-center pointer-events-none">
                      <TopFloatingBar />
                    </div>
                  </div>

                  {/* ── Top-Right Utility Region ───────────────────────────────────────
                      Independent fixed container that owns ONLY the Pulse + Clock cluster.
                      The cluster is grouped here (flex gap-3) and justified to the viewport's
                      right edge — its placement depends on nothing but this region. On
                      viewports below xl the centered nav + right cluster cannot share one row
                      without overlap (measured: cluster 213px wide vs only ~130px of free
                      space to the nav's right edge at 1024px, and ~208px at 1180px), so this
                      region drops the cluster onto its own second row (top-[96px], clearing
                      the 76px nav band); at >= xl it rides the same top band as the nav
                      (aligned to the 76px bar height) with a verified clearance of >=15px
                      between nav and cluster at every width >=1280px. Both thresholds are
                      owned by THIS region, not the nav. The nav's centering is never coupled
                      here. */}
                  <div className="desktop-only">
                    <div className="fixed inset-x-0 top-[96px] z-[150] flex justify-end pointer-events-none xl:top-1 xl:h-[76px] xl:items-center">
                      <div className="flex items-center gap-3 pr-8 pointer-events-auto">
                        <PulseBell variant="desktop" />
                        <SystemClock />
                      </div>
                    </div>
                  </div>
                  <div className="lg:hidden">
                    <PulseBell variant="mobile" />
                  </div>
                  <div className="lg:hidden">
                    <MobileNavbar />
                  </div>
                  <div className="desktop-only">
                    <BottomFloatingBar />
                  </div>
                  <SystemCoreOrb />

                  <main className="app-root relative z-10">
                    {children}
                  </main>

                  <GlobalMessageOverlay />
                  <GlobalTerminalRenderer />

                  <div className="desktop-only">
                    <GlobalFooter />
                  </div>
                  <div className="lg:hidden">
                    <MobileBottomNav />
                  </div>
                </AppStartupGate>
              </RenderScaler>
            </FoxProvider>
          </MediaOrchestrator>
        </UIProvider>
      </body>
    </html>
  )
}
