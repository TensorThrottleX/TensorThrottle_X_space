'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { MobileHeader } from '@/components/layout/MobileHeader'

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
    const { uiMode, mainView, renderMode, navUtilityExpanded } = useUI()
    const [contentMode, setContentMode] = useState<'purpose' | 'about' | 'quote'>('purpose')
    const isBright = renderMode === 'bright'

    return (
        <div
            className="mobile-layout relative min-h-screen w-full flex flex-col"
            style={{
                backgroundColor: 'transparent',
                paddingTop: navUtilityExpanded ? '100px' : '56px',   // Header height + expanded nav
                paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', // Bottom nav height + safe area
            }}
        >
            {/* Mobile Header */}
            <MobileHeader />

            {/* Main Content Area */}
            <div className="flex-1 w-full overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {mainView === 'dashboard' && (
                        <motion.div
                            key="mobile-dashboard-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Hero Section - Mobile */}
                            <div className="text-center pt-10 pb-2 px-6">
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4 inline-block"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    TensorThrottle X
                                </motion.span>
                                <motion.h1
                                    initial={{ opacity: 0, filter: 'blur(12px)', y: 10 }}
                                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                    transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.15]"
                                    style={{ color: 'var(--heading-primary)' }}
                                >
                                    Living Engineering
                                    <br />
                                    <span style={{ color: 'var(--primary)' }}>Workspace</span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-sm mt-4 max-w-xs mx-auto leading-relaxed opacity-50"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Building AI systems, reasoning engines, machine learning research, and interactive knowledge.
                                </motion.p>
                            </div>

                            {/* Content Mode Tabs */}
                            <div className="flex justify-center py-3 px-4">
                                <div
                                    className="relative flex items-center rounded-full p-[3px] gap-[2px] w-full max-w-[260px] backdrop-blur-xl"
                                    style={{
                                        backgroundColor: isBright ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                                        boxShadow: isBright
                                            ? '0 2px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                                            : '0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {/* Sliding Indicator */}
                                    <motion.div
                                        className="absolute h-[calc(100%-6px)] rounded-full"
                                        initial={false}
                                        animate={{
                                            x: contentMode === 'purpose' ? 0 : (contentMode === 'about' ? '100%' : '200%'),
                                            left: 3,
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        style={{
                                            top: 3,
                                            width: 'calc(33.33% - 4px)',
                                            backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                            boxShadow: isBright
                                                ? '0 1px 4px rgba(0,0,0,0.06)'
                                                : '0 1px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
                                        }}
                                    />

                                    {(['purpose', 'about', 'quote'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setContentMode(tab)}
                                            className={`relative flex-1 h-[30px] text-[10.5px] font-medium tracking-[0.1em] transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === tab
                                                ? (isBright ? 'text-black' : 'text-white')
                                                : (isBright ? 'text-black/35 hover:text-black/55' : 'text-white/40 hover:text-white/65')
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
                    )}
                </AnimatePresence>
            </div>

        </div>
    )
}
