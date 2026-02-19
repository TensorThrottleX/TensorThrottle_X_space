'use client'

import React from 'react'
import { useUI } from '@/components/providers/UIProvider'

export function TrademarkLogo() {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'
    const isDark = renderMode === 'dark'

    return (
        <div className="fixed bottom-24 left-5 lg:bottom-8 lg:left-10 z-[150] pointer-events-auto select-none opacity-100 mix-blend-normal transition-opacity duration-500 group">
            <div
                className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full border-2 flex items-center justify-center transition-[transform,background-color,border-color,box-shadow] duration-500 cursor-pointer hover:scale-110 active:scale-95
                    ${isBright
                        ? 'bg-white border-black/10 shadow-lg group-hover:bg-black group-hover:border-black'
                        : (isDark ? 'bg-black border-white/10 shadow-none hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-black border-white/20 shadow-[0_0_15px_rgba(255,165,0,0.5)] hover:shadow-[0_0_25px_rgba(255,165,0,0.7)]')
                    }
                `}
            >
                <span
                    className={`font-black text-lg lg:text-xl tracking-tighter transition-colors duration-500
                        ${isBright ? 'text-black group-hover:text-white' : 'text-orange-500'}
                    `}
                >
                    TX
                </span>
            </div>
        </div>
    )
}
