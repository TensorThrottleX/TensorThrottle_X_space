'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { LabContainer } from '@/components/layout/LabContainer';
import { SpaceAtmosphere } from '@/components/layout/SpaceAtmosphere';
import { ConveyorTags } from '@/components/visuals/ConveyorTags';
import { useUI } from '@/components/providers/UIProvider';

import type { FoundationModuleProps } from '@/components/dashboard/FoundationModule';

import GlobeSection from '@/components/globe/GlobeSection';
import FoundationModule from '@/components/dashboard/FoundationModule';

export default function HomePageLayout() {
    const { uiMode, mainView, renderMode, setIsTerminalOpen } = useUI();
    const isBright = renderMode === 'bright';

    const globeWrapperRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    const globeSectionActive = mainView === 'dashboard' && uiMode === 'default';



    const computeProgress = useCallback(() => {
        if (!globeWrapperRef.current) return 0;
        const rect = globeWrapperRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const trigger = vh * 0.65;
        return Math.max(0, Math.min((trigger - rect.top) / trigger, 1));
    }, []);

    // Recalculate on every scroll so revealProgress updates reactively
    useEffect(() => {
        const update = () => setScrollProgress(computeProgress())
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update, { passive: true })
        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [computeProgress])

    // Space atmosphere progression — 0→1 as globe section enters viewport
    const spaceProgress = scrollProgress;

    // Globe reveal lags slightly behind atmosphere
    const revealProgress = Math.max(0, Math.min((spaceProgress - 0.15) / 0.7, 1));

    return (
        <>
        <SpaceAtmosphere spaceProgress={spaceProgress} />
        <LabContainer videoSrc="/media/videos/default-background.mp4">
            {/* Removed AdaptiveBackground as it causes a third theme state by overriding CSS variables */}

            {/* Main scrollable content */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {mainView === 'dashboard' && uiMode === 'default' && (
                        <motion.div
                            key="home-hero"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* ── Hero + Cards Section ── */}
                            <div className="flex flex-col items-center w-full min-h-screen pt-20 lg:pt-28 pb-24 lg:pb-48">
                                {/* ── Hero Section ── */}
                                <div className="flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
                                    <motion.h1
                                        initial={{ opacity: 0, filter: 'blur(16px)', y: 30 }}
                                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                        className="leading-[1.05] mb-3 whitespace-normal lg:whitespace-nowrap"
                                        style={{
                                            fontFamily: "'Stay Chill', sans-serif",
                                            fontWeight: 700,
                                            fontSize: 'clamp(28px, 4.5vw, 58px)',
                                            letterSpacing: '0.02em',
                                            color: 'var(--adaptive-hero-color)',
                                            textShadow: 'var(--adaptive-hero-shadow)',
                                        }}>
                                        TensorThrottle X Space
                                    </motion.h1>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        style={{
                                            fontFamily: "'Stay Chill', sans-serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(22px, 3.5vw, 38px)',
                                            color: 'var(--adaptive-hero-secondary)',
                                            letterSpacing: '-0.01em',
                                        }}
                                        className="mb-1"
                                    >
                                        Dimension for Exploration.
                                    </motion.h2>

                                    <motion.p
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        style={{
                                            fontFamily: "'Stay Chill', sans-serif",
                                            fontWeight: 450,
                                            fontSize: 'clamp(16px, 2.2vw, 26px)',
                                            color: 'var(--adaptive-hero-muted)',
                                        }}
                                        className="mb-5"
                                    >
                                        Nothing Here Is Truly Finished.
                                    </motion.p>
                                </div>

                                {/* ── Floating Tags Conveyor ── */}
                                <motion.div
                                    className="w-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <ConveyorTags />
                                </motion.div>

                                {/* ── Foundation Cards ── */}
                                <motion.div
                                    className="w-full max-w-5xl mx-auto px-6 mt-8"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <FoundationModule isBright={isBright} />
                                </motion.div>
                            </div>

                            {/* ── Globe Section (Chapter 2) ── */}
                            <div ref={globeWrapperRef}>
                                <GlobeSection isBright={isBright} revealProgress={revealProgress} />
                            </div>

                            {/* ── Footer spacer ── */}
                            <div className="h-32" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


        </LabContainer>
        </>
    );
}
