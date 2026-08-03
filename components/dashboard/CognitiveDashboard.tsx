'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { useEffect, useRef } from 'react'
import { InteractiveTree } from '@/components/visuals/InteractiveTree'
import { StackedDeck } from './StackedDeck'
import { QuoteCard } from './QuoteCard'
import { DASHBOARD_CONTENT } from '@/lib/dashboard-data'

type DashboardMode = 'purpose' | 'about' | 'quote'

interface CognitiveDashboardProps {
    mode?: DashboardMode
}

export function CognitiveDashboard({ mode = 'purpose' }: CognitiveDashboardProps) {
    const { uiMode, setUiMode, renderMode } = useUI()
    const isBright = renderMode === 'bright'
    const prevModeRef = useRef(mode)

    useEffect(() => {
        if (prevModeRef.current !== mode) {
            if (uiMode === 'tree') setUiMode('default')
            prevModeRef.current = mode
        }
    }, [mode, uiMode, setUiMode])

    const displayedContent = DASHBOARD_CONTENT[mode]

    return (
        <motion.div
            key="cognitive-dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
        >
            <AnimatePresence mode="wait">
                {uiMode !== 'tree' && displayedContent ? (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative w-full flex flex-col items-center justify-start pointer-events-none z-0 pb-20"
                    >
                        <div className="relative pointer-events-auto w-full flex justify-center px-4">
                            {mode === 'quote' ? (
                                <QuoteCard isBright={isBright} />
                            ) : (
                                <StackedDeck
                                    mode={mode}
                                    content={displayedContent}
                                    isBright={isBright}
                                    onInitialize={() => setUiMode('tree')}
                                />
                            )}
                        </div>
                    </motion.div>
                ) : uiMode === 'tree' && displayedContent ? (
                    <InteractiveTree
                        key="tree"
                        data={displayedContent.treeData}
                        onClose={() => setUiMode('default')}
                    />
                ) : null}
            </AnimatePresence>
        </motion.div>
    )
}
