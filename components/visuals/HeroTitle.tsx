'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'

export function HeroTitle() {
    const pathname = usePathname()
    const { uiMode } = useUI()

    // Only render on home page
    if (pathname !== '/') return null

    return (
        <div className={`hero-title absolute top-[60px] left-[60px] z-50 transition-[opacity,transform] duration-500 ease-in-out ${uiMode === 'tree' ? 'opacity-0 -translate-y-5 pointer-events-none' : 'opacity-100 translate-y-0'
            }`}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[0.1em] font-sans m-0 text-white leading-none select-none uppercase">
                TENSOR THROTTLE
                <span className="text-cyan-400 ml-3 font-black">X</span>
            </h1>
        </div>
    )
}
