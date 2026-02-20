'use client'

import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileHomeLayout } from '@/components/layout/MobileLayout'
import { HomePageLayout } from '@/components/layout/HomePageLayout'

/**
 * ResponsiveHome
 * 
 * Root-level responsive switcher for the home page.
 * - < 1024px: Renders MobileHomeLayout (independent mobile structure)
 * - >= 1024px: Renders HomePageLayout (existing desktop floating layout)
 * 
 * No shared floating positioning. Only presentation layer changes.
 */
export function ResponsiveHome() {
    const isMobile = useIsMobile()

    // Server-render fallback: render desktop by default, mobile takes over on client
    if (typeof window === 'undefined') {
        return <HomePageLayout />
    }

    return isMobile ? (
        <MobileHomeLayout />
    ) : (
        <HomePageLayout />
    )
}
