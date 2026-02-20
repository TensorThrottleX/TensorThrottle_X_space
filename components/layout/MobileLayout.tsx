'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { MobileTerminal } from '@/components/layout/MobileTerminal'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'
import { MsgView } from '@/components/forms/MsgView'

/**
 * MobileHomeLayout
 * 
 * Complete mobile-optimized home page layout.
 * Replaces the desktop HomePageLayout when viewport < 1024px.
 * 
 * Structure:
 * - MobileHeader (top)
 * - Main content (scrollable, full width)
 * - MobileBottomNav (fixed bottom)
 * - MobileTerminal (FAB + overlay)
 */
export function MobileHomeLayout() {
    const { uiMode, mainView, renderMode } = useUI()
    const [contentMode, setContentMode] = useState<'purpose' | 'about' | 'quote'>('purpose')
    const isBright = renderMode === 'bright'

    return (
        <div
            className="mobile-layout relative min-h-screen w-full flex flex-col"
            style={{
                backgroundColor: 'transparent',
                paddingTop: '56px',   // Header height
                paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', // Bottom nav height + safe area
            }}
        >
            {/* Mobile Header */}
            <MobileHeader latestPublishedAt={latestPublishedAt} />

            {/* Main Content Area */}
            <div className="flex-1 w-full overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {mainView === 'dashboard' ? (
                        <motion.div
                            key="mobile-dashboard-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Hero Title */}
                            <div className="text-center pt-8 pb-2 px-4">
                                <motion.h1
                                    initial={{ opacity: 0, filter: 'blur(12px)', y: 10 }}
                                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-4xl font-black tracking-tighter"
                                    style={{ color: 'var(--heading-primary)' }}
                                >
                                    TENSOR{'\n'}THROTTLE X
                                </motion.h1>
                            </div>

                            {/* Content Mode Tabs */}
                            <div className="flex justify-center py-4 px-4">
                                <div className="relative flex items-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 gap-0.5 w-full max-w-sm"
                                    style={{
                                        backgroundColor: isBright ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.4)',
                                        borderColor: isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {/* Sliding Indicator */}
                                    <motion.div
                                        className="absolute h-[calc(100%-8px)] rounded-full shadow-inner border"
                                        initial={false}
                                        animate={{
                                            x: contentMode === 'purpose' ? 0 : (contentMode === 'about' ? '100%' : '200%'),
                                            left: 4,
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        style={{
                                            top: 4,
                                            width: 'calc(33.33% - 4px)',
                                            backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                            borderColor: isBright ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                                        }}
                                    />

                                    {(['purpose', 'about', 'quote'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setContentMode(tab)}
                                            className={`relative flex-1 h-9 text-xs font-bold tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === tab
                                                ? (isBright ? 'text-black' : 'text-white')
                                                : (isBright ? 'text-black/40' : 'text-white/50')
                                                }`}
                                        >
                                            {tab.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dashboard Content */}
                            <AnimatePresence mode="wait">
                                <MobileDashboard key={contentMode} mode={contentMode} />
                            </AnimatePresence>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="mobile-msg-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="px-4 pt-4"
                        >
                            <MsgView />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Terminal FAB + Overlay */}
            {mainView === 'dashboard' && <MobileTerminal />}

            {/* Bottom Navigation */}
            <MobileBottomNav />
        </div>
    )
}
