'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Lazy-loaded layouts — Desktop users don't download mobile bundle (31KB+)
 * and mobile users don't download desktop bundle (22KB+).
 * Each loads only when the breakpoint matches.
 */
const HomePageLayout = dynamic(
    () => import('@/components/layout/HomePageLayout').then(m => ({ default: m.HomePageLayout })),
    { ssr: false }
)
const MobileHomeLayout = dynamic(
    () => import('@/components/layout/MobileLayout').then(m => ({ default: m.MobileHomeLayout })),
    { ssr: false }
)

/**
 * ResponsiveHome
 * 
 * Root-level responsive switcher for the home page.
 * - < 1024px: Renders MobileHomeLayout (lazy, client-only)
 * - >= 1024px: Renders HomePageLayout (lazy, SSR-capable)
 * 
 * Hydration-safe: returns null during SSR-to-client transition
 * to avoid desktop→mobile flash.
 */
export function ResponsiveHome() {
    const isMobile = useIsMobile()

    return (
        <Suspense fallback={<HomeLoadingFallback />}>
            {isMobile ? <MobileHomeLayout /> : <HomePageLayout />}
        </Suspense>
    )
}

/** Lightweight skeleton shown while layouts load */
function HomeLoadingFallback() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--muted-foreground)', borderTopColor: 'transparent' }} />
        </div>
    )
}
