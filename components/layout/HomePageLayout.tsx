'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LabContainer } from '@/components/layout/LabContainer';
import { LabNavigation } from '@/components/layout/LabNavigation';
import { RightFloatingBar } from '@/components/layout/RightFloatingBar';
import { InteractiveHome } from '@/components/visuals/InteractiveHome';

import { CognitiveDashboard } from '@/components/dashboard/CognitiveDashboard';
import { MsgView } from '@/components/forms/MsgView';
import { useUI } from '@/components/providers/UIProvider';
import { AnimatePresence } from 'framer-motion';
import { StatusButton } from '@/components/ui/StatusButton';

/* HOME > LAYOUT > COMPONENT > MAIN_PAGE_CONTROLLER */
export function HomePageLayout() {
    // [SCREENSHOT]: Used as the main layout controller. 
    // It manages the state for 'Purpose' vs 'About' and renders the global persistent elements (Title, Toggle).
    const { uiMode, mainView } = useUI();
    const [contentMode, setContentMode] = useState<'purpose' | 'about' | 'quote'>('purpose');

    return (
        <LabContainer videoSrc="/media/videos/default-background.mp4">
            {/* [FLOW_PLANE]: Main vertical stack -> .viewport-section for Vertical Balance */}
            <div className="viewport-section flex-col items-center w-full">
                {/* 1. Header Title (Flow-based) -> .hero-header for Width Constraint */}
                <AnimatePresence>
                    {mainView === 'dashboard' && uiMode === 'default' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="hero-header relative w-full flex justify-center z-40 pointer-events-none select-none pb-4"
                        >
                            <motion.h1
                                initial={{ opacity: 0, filter: 'blur(12px)', y: 10 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                className="text-h1 font-black tracking-tighter drop-shadow-2xl"
                                style={{ color: 'var(--heading-primary)' }}
                            >
                                TENSOR THROTTLE X
                            </motion.h1>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* 2. Content Toggle (Flow-based) */}
                <AnimatePresence>
                    {mainView === 'dashboard' && uiMode === 'default' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative w-full flex justify-center z-50 pointer-events-auto py-4"
                        >
                            <div className="relative flex items-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 shadow-2xl gap-1">
                                {/* Sliding Indicator */}
                                <motion.div
                                    className="absolute h-[calc(100%-8px)] rounded-full bg-white/10 backdrop-blur-md shadow-inner border border-white/5"
                                    initial={false}
                                    animate={{
                                        x: contentMode === 'purpose' ? 0 : (contentMode === 'about' ? 114 : 228)
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{
                                        left: 4,
                                        top: 4,
                                        width: 110
                                    }}
                                />

                                {/* Purpose Button */}
                                <button
                                    onClick={() => setContentMode('purpose')}
                                    className={`relative w-[110px] h-9 text-xs font-bold tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'purpose' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    PURPOSE
                                </button>

                                {/* About Button */}
                                <button
                                    onClick={() => setContentMode('about')}
                                    className={`relative w-[110px] h-9 text-xs font-bold tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'about' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    ABOUT
                                </button>

                                {/* Quote Button */}
                                <button
                                    onClick={() => setContentMode('quote')}
                                    className={`relative w-[110px] h-9 text-xs font-bold tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'quote' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    QUOTE
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. INTERFACE_PLANE (Independent fixed layers) */}
                <LabNavigation />
                <RightFloatingBar />

                {/* 4. DYNAMIC CENTER CONTENT (Participates in flow) */}
                <div className="relative w-full flex-1 flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        {mainView === 'dashboard' ? (
                            <CognitiveDashboard key="dashboard" mode={contentMode} />
                        ) : (
                            <MsgView key="msg" />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Terminal Sits ON TOP - Restrict to Home Page (Dashboard) Only */}
            <AnimatePresence>
                {mainView === 'dashboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 pointer-events-none z-[100]"
                    >
                        <InteractiveHome />
                    </motion.div>
                )}
            </AnimatePresence>
        </LabContainer>
    );
}
