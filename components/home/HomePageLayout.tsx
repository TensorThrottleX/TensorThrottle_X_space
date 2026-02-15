'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LabContainer } from '@/components/LabContainer';
import { LabNavigation } from '@/components/LabNavigation';
import { RightFloatingBar } from '@/components/RightFloatingBar';
import { InteractiveHome } from '@/components/InteractiveHome';

import { CognitiveDashboard } from '@/components/CognitiveDashboard';
import { MsgView } from '@/components/MsgView';
import { useUI } from '@/components/providers/UIProvider';
import { AnimatePresence } from 'framer-motion';

/* HOME > LAYOUT > COMPONENT > MAIN_PAGE_CONTROLLER */
export function HomePageLayout() {
    // [SCREENSHOT]: Used as the main layout controller. 
    // It manages the state for 'Purpose' vs 'About' and renders the global persistent elements (Title, Toggle).
    const { uiMode, mainView } = useUI();
    const [contentMode, setContentMode] = useState<'purpose' | 'about' | 'quote'>('purpose');

    return (
        <>
            <LabContainer videoSrc="/background.mp4">
                {/* [SCREENSHOT]: 'TENSOR THROTTLE X' Title 
                    - Rendered here as a fixed, animated header.
                    - Visually dominates the top center of the screen.
                */}
                <AnimatePresence>
                    {mainView === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-[60px] left-0 w-full flex justify-center z-40 pointer-events-none select-none"
                        >
                            <motion.h1
                                initial={{ opacity: 0, filter: 'blur(12px)', y: 10 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                className="text-h1 font-bold tracking-tight drop-shadow-2xl"
                                style={{ color: 'var(--heading-primary)' }}
                            >
                                TENSOR THROTTLE X
                            </motion.h1>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* [SCREENSHOT]: 'PURPOSE | ABOUT' Toggle Switch
                    - Located directly below the main title.
                    - Controls the 'contentMode' state which changes the CognitiveDashboard content.
                */}
                <AnimatePresence>
                    {mainView === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-[120px] md:top-[140px] left-0 w-full flex justify-center z-50 pointer-events-auto"
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
                                    className={`relative w-[110px] h-9 text-sm font-medium tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'purpose' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    PURPOSE
                                </button>

                                {/* About Button */}
                                <button
                                    onClick={() => setContentMode('about')}
                                    className={`relative w-[110px] h-9 text-sm font-medium tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'about' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    ABOUT
                                </button>

                                {/* Quote Button */}
                                <button
                                    onClick={() => setContentMode('quote')}
                                    className={`relative w-[110px] h-9 text-sm font-medium tracking-wide transition-colors duration-300 rounded-full flex items-center justify-center ${contentMode === 'quote' ? 'text-white' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    QUOTE
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. CORE LAYOUT ELEMENTS (Persistent) */}

                <LabNavigation />
                <RightFloatingBar />

                {/* 4. DYNAMIC CENTER CONTENT (Cognitive Dashboard vs MsgView) */}
                <AnimatePresence mode="wait">
                    {mainView === 'dashboard' ? (
                        <CognitiveDashboard key="dashboard" mode={contentMode} />
                    ) : (
                        <MsgView key="msg" />
                    )}
                </AnimatePresence>

            </LabContainer>

            {/* Terminal Sits ON TOP of the fading container - Restrict to Home Page (Dashboard) Only */}
            <AnimatePresence>
                {mainView === 'dashboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 pointer-events-none z-50"
                    >
                        <InteractiveHome />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
