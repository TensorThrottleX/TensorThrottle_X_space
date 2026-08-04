'use client'

import React from 'react'
import InteractiveHome from '@/components/visuals/InteractiveHome';
import MobileTerminal from '@/components/layout/MobileTerminal';

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
