'use client'

import React from 'react'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { MobileTerminal } from '@/components/layout/MobileTerminal'
import { useUI } from '@/components/providers/UIProvider'

/**
 * MobileContentLayout
 * 
 * Generic mobile wrapper for content pages (feed, category, post).
 * Provides the same header + bottom nav chrome while allowing children
 * to be full-width scrollable content.
 */
export function MobileContentLayout({ children, pageTitle, articleCount }: { children: React.ReactNode; pageTitle?: string; articleCount?: number }) {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'

    return (
        <div
            className="mobile-layout relative min-h-screen w-full flex flex-col"
            style={{
                backgroundColor: isBright ? '#fafafa' : '#000',
                paddingTop: '56px',
                paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            }}
        >
            <MobileHeader pageTitleOverride={pageTitle} articleCount={articleCount} />

            <div className="flex-1 w-full overflow-x-hidden">
                {children}
            </div>

            <MobileTerminal />
            <MobileBottomNav />
        </div>
    )
}
