'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

interface QuoteData {
    text: string
    author?: string
}

const SYSTEM_QUOTES: QuoteData[] = [
    { text: "Those who cannot acknowledge themselves will eventually fail.", author: "Itachi Uchiha" },
    { text: "If you don’t take risks, you can’t create a future.", author: "Monkey D. Luffy" },
    { text: "Push through the pain. Giving up hurts more.", author: "Vegeta" },
    { text: "No matter how deep the night, it always turns to day.", author: "Brook" },
    { text: "The world isn’t perfect. But it’s there for us, trying the best it can.", author: "Roy Mustang" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" }
]

export function SystemQuoteRenderer() {
    const { renderMode } = useUI()
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(-1)
    const [displayPhase, setDisplayPhase] = useState<'display' | 'erasing' | 'paused' | 'typing'>('paused')
    const [visibleText, setVisibleText] = useState("")
    const [visibleAuthor, setVisibleAuthor] = useState("")

    // Animation Constants
    const ERASE_SPEED_MS = 20
    const TYPE_SPEED_MS = 25
    const PAUSE_DURATION_MS = 150
    const DISPLAY_DURATION_MS = 10000

    // [RANDOMIZER] – Pick a random starting quote on mount to avoid hydration mismatch
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * SYSTEM_QUOTES.length)
        setCurrentQuoteIndex(randomIndex)
        setDisplayPhase('typing')
    }, [])


    useEffect(() => {
        if (displayPhase === 'paused' && visibleText === "" && visibleAuthor === "") return // Wait for hydration effect

        let timeoutId: NodeJS.Timeout

        const runCycle = () => {
            if (displayPhase === 'display') {
                timeoutId = setTimeout(() => {
                    setDisplayPhase('erasing')
                }, DISPLAY_DURATION_MS)
            }
            else if (displayPhase === 'erasing') {
                if (visibleText.length > 0) {
                    timeoutId = setTimeout(() => {
                        setVisibleText(prev => prev.slice(0, -1))
                        if (visibleText.length < 5) setVisibleAuthor('')
                    }, ERASE_SPEED_MS)
                } else {
                    setDisplayPhase('paused')
                }
            }
            else if (displayPhase === 'paused') {
                // If we've finished erasing, pick a NEW random quote
                timeoutId = setTimeout(() => {
                    let nextIndex = currentQuoteIndex
                    // Avoid picking the same quote twice in a row
                    while (nextIndex === currentQuoteIndex && SYSTEM_QUOTES.length > 1) {
                        nextIndex = Math.floor(Math.random() * SYSTEM_QUOTES.length)
                    }

                    setCurrentQuoteIndex(nextIndex)
                    setVisibleAuthor('')
                    setDisplayPhase('typing')
                }, PAUSE_DURATION_MS)
            }
            else if (displayPhase === 'typing' && currentQuoteIndex !== -1) {
                const targetQuote = SYSTEM_QUOTES[currentQuoteIndex]
                if (visibleText.length < targetQuote.text.length) {
                    timeoutId = setTimeout(() => {
                        setVisibleText(targetQuote.text.slice(0, visibleText.length + 1))
                    }, TYPE_SPEED_MS)
                } else {
                    setVisibleAuthor(targetQuote.author || "")
                    setDisplayPhase('display')
                }
            }
        }

        runCycle()
        return () => clearTimeout(timeoutId)
    }, [displayPhase, visibleText, currentQuoteIndex])


    return (
        <div className={cn(
            "primary-card relative overflow-hidden transition-colors duration-300 items-center justify-center text-center",
            "border-[1.5px] border-b-[4px] border-r-[2px]",
            renderMode === 'bright'
                ? "bg-white border-black/10 border-b-black/20 border-r-black/15 shadow-[var(--shadow-premium)]"
                : "bg-black/60 backdrop-blur-xl border-white/10 border-b-white/20 border-r-black/15 shadow-[var(--shadow-premium)]"
        )}>
            {/* Quote Label */}
            <div className="absolute top-10 left-10 flex items-center gap-3">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-colors duration-300",
                    displayPhase === 'typing' ? "bg-white animate-pulse" : "bg-cyan-400"
                )} />
                <span className={cn(
                    "text-xs font-bold tracking-normal uppercase",
                    renderMode === 'bright' ? "text-cyan-600/90" : "text-cyan-200/70"
                )}>
                    SYSTEM_MEMORY
                </span>
            </div>

            {/* Quote Content */}
            <div className="max-w-2xl min-h-[11.25rem] flex flex-col justify-center">
                <h2 className={cn(
                    "text-4xl md:text-[3.2rem] font-extrabold leading-tight tracking-tighter",
                    displayPhase === 'typing' ? "animate-pulse" : "",
                    renderMode === 'bright' ? "text-black/90" : "text-white/95"
                )}>
                    "{visibleText}"<span className={cn("inline-block w-2.5 h-8 bg-cyan-500/50 align-middle ml-1", displayPhase === 'display' ? "opacity-0" : "animate-pulse")}></span>
                </h2>
                <div className="h-8 mt-8">
                    {visibleAuthor && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                                "text-sm font-medium tracking-normal uppercase",
                                renderMode === 'bright' ? "text-black/50" : "text-white/40"
                            )}
                        >
                            — {visibleAuthor}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {displayPhase === 'display' && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-500/30 w-full">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10, ease: "linear" }}
                        className="h-full bg-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                </div>
            )}
        </div>
    )
}
