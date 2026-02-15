import React from "react"
import type { Metadata } from 'next'
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

import { UIProvider } from "@/components/providers/UIProvider"
import { MediaEngineProvider } from "@/components/providers/MediaProvider"

import { TrademarkLogo } from "@/components/TrademarkLogo"
import { GlobalFooter } from "@/components/GlobalFooter"
import { SystemClock } from "@/components/SystemClock"

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
            <SystemClock />
            <TrademarkLogo />
            <GlobalFooter />
            {children}
          </MediaEngineProvider>
        </UIProvider>
      </body>
    </html>
  )
}
