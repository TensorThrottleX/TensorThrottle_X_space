import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: 'TensorThrottle_X_space | %s',
    default: 'TensorThrottle_X_space',
  },
  description: 'A production-ready portfolio powered by Notion and Next.js',
  icons: {
    icon: '/android-chrome-512x512.png',
    shortcut: '/android-chrome-512x512.png',
    apple: '/android-chrome-512x512.png',
  },
}

import { UIProvider } from "@/components/providers/UIProvider"
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer"

import { TrademarkLogo } from "@/components/TrademarkLogo"
import { GlobalFooter } from "@/components/GlobalFooter"
import { SystemClock } from "@/components/SystemClock"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <UIProvider>
          <GlobalAudioPlayer />
          <SystemClock />
          <TrademarkLogo />
          <GlobalFooter />
          {children}
        </UIProvider>
      </body>
    </html>
  )
}
