'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const InteractiveHome = dynamic(() => import('@/components/visuals/InteractiveHome').then(m => m.InteractiveHome), { ssr: false })
const MobileTerminal = dynamic(() => import('@/components/layout/MobileTerminal').then(m => m.MobileTerminal), { ssr: false })

export function GlobalTerminalRenderer() {
    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="hidden lg:block">
                <InteractiveHome />
            </div>
            <div className="lg:hidden">
                <MobileTerminal />
            </div>
        </div>
    )
}
