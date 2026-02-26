'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { InteractiveTree } from '@/components/visuals/InteractiveTree'
import { StackedDeck } from './StackedDeck'
import { SystemQuoteRenderer } from './SystemQuoteRenderer'
import { DASHBOARD_CONTENT } from '@/lib/dashboard-data'

type DashboardMode = 'purpose' | 'about' | 'quote'

interface CognitiveDashboardProps {
    mode?: DashboardMode
}

/**
 * COGNITIVE_DASHBOARD
 * High-order layout for the main landing experience.
 * Orchestrates between StackedDeck, SystemQuotes, and the InteractiveTree.
 */
export function CognitiveDashboard({ mode = 'purpose' }: CognitiveDashboardProps) {
    const { uiMode, setUiMode, renderMode } = useUI()
    const isBright = renderMode === 'bright'

    // [CRITICAL_SYNC] – Reset immersion state if mode changes
    const prevModeRef = useRef(mode)
    useEffect(() => {
        if (prevModeRef.current !== mode) {
            if (uiMode === 'tree') setUiMode('default')
            prevModeRef.current = mode
        }
    }, [mode, uiMode, setUiMode])

    const isQuote = mode === 'quote'
    const currentContent = isQuote ? null : DASHBOARD_CONTENT[mode as 'purpose' | 'about']

    return (
        <motion.div
            key="cognitive-dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
        >
            <AnimatePresence mode="wait">
                {isQuote ? (
                    <motion.div
                        key="quote"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative w-full flex flex-col items-center justify-start pointer-events-none z-0 pb-20"
                    >
                        <div className="relative pointer-events-auto w-full flex justify-center px-4">
                            <SystemQuoteRenderer />
                        </div>
                    </motion.div>
                ) : currentContent && uiMode !== 'tree' ? (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative w-full flex flex-col items-center justify-start pointer-events-none z-0 pb-20"
                    >
                        <div className="relative pointer-events-auto w-full flex justify-center px-4">
                            <StackedDeck
                                mode={mode as 'purpose' | 'about'}
                                content={currentContent}
                                isBright={isBright}
                                onInitialize={() => setUiMode('tree')}
                            />
                        </div>
                    </motion.div>
                ) : currentContent ? (
                    <InteractiveTree
                        key="tree"
                        data={currentContent.treeData}
                        onClose={() => setUiMode('default')}
                    />
                ) : null}
            </AnimatePresence>
        </motion.div>
    )
}
