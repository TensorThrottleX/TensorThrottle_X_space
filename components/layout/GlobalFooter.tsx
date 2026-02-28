'use client'

import React from 'react'

import { useUI } from '@/components/providers/UIProvider'

export function GlobalFooter() {
    const { isBooting } = useUI()
    if (isBooting) return null;
    return (
        <footer className="fixed bottom-0 left-0 w-full flex justify-center py-2 z-50 pointer-events-none select-none bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-[9px] font-medium text-gray-400/80 tracking-normal uppercase">
                © 2026 TensorThrottle X. All Rights Reserved.
            </span>
        </footer>
    )
}
