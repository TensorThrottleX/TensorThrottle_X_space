'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const HomePageLayout = dynamic(
    () => import('@/components/layout/HomePageLayout').then(m => ({ default: m.HomePageLayout })),
    { ssr: false }
)

export function ResponsiveHome() {
    return (
        <Suspense fallback={<HomeLoadingFallback />}>
            <HomePageLayout />
        </Suspense>
    )
}

function HomeLoadingFallback() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--muted-foreground)', borderTopColor: 'transparent' }} />
        </div>
    )
}
