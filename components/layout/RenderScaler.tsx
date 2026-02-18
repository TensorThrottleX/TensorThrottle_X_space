'use client'

import React from 'react'

/**
 * [RenderScaler]
 * 
 * Lightweight pass-through wrapper. The actual scaling is now handled
 * entirely via CSS (viewport-relative units in globals.css).
 * 
 * This component is kept as a structural anchor so existing imports
 * and layout hierarchy remain intact without modification.
 * 
 * Strategy: Pure CSS viewport-relative scaling
 * - Root font-size uses clamp() with vw so everything scales proportionally
 * - No transform: scale() — avoids breaking fixed positioning
 * - No JS measurement — avoids height miscalculation / layout jumps
 * - Zoom-resilient: browser zoom changes vw, so layout responds naturally
 */
export function RenderScaler({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="render-scaler-root"
            style={{
                width: '100%',
                minHeight: '100dvh',
                position: 'relative',
            }}
        >
            {children}
        </div>
    )
}
