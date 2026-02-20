'use client'

import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileContentLayout } from '@/components/layout/MobileContentLayout'

/**
 * ResponsiveContentWrapper
 * 
 * Client component wrapper for content pages (feed, category, post).
 * On mobile: wraps children in MobileContentLayout (mobile chrome).
 * On desktop: passes children through unchanged (desktop layout is handled by each page).
 */
export function ResponsiveContentWrapper({
    children,
    pageTitle,
    articleCount,
    latestPublishedAt
}: {
    children: React.ReactNode;
    pageTitle?: string;
    articleCount?: number;
    latestPublishedAt?: string;
}) {
    const isMobile = useIsMobile()

    if (typeof window === 'undefined') return <>{children}</>

    return isMobile ? (
        <MobileContentLayout
            pageTitle={pageTitle}
            articleCount={articleCount}
            latestPublishedAt={latestPublishedAt}
        >
            {children}
        </MobileContentLayout>
    ) : (
        <>{children}</>
    )
}
