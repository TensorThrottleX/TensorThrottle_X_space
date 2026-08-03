'use client'

import React from 'react'

import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

export function GlobalFooter() {
    const { renderMode, isBooting } = useUI()
    if (isBooting) return null;
    const isBright = renderMode === 'bright'
    return (
        <footer className="w-full flex justify-center py-6 pointer-events-none select-none">
            <span className={cn(
                "text-[9px] font-medium tracking-normal uppercase transition-colors duration-300",
                isBright ? "text-[#55514B]/60" : "text-gray-400/80"
            )}>
                © 2026 TensorThrottle X. All Rights Reserved.
            </span>
        </footer>
    )
}
