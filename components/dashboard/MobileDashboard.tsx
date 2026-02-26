'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { InteractiveTree } from '@/components/visuals/InteractiveTree'
import { X as XClose } from 'lucide-react'
import { DASHBOARD_CONTENT, SYSTEM_QUOTES, CardContent } from '@/lib/dashboard-data'

// ─── TYPES (Minimal local overrides if needed) ───
interface MobileDashboardProps { mode?: 'purpose' | 'about' | 'quote' }

// ─── MOBILE DASHBOARD ───
export function MobileDashboard({ mode = 'purpose' }: MobileDashboardProps) {
    const { uiMode, setUiMode, renderMode } = useUI()
    const isBright = renderMode === 'bright'

    useEffect(() => { if (uiMode === 'tree') setUiMode('default') }, [mode])

    if (mode === 'quote') return <MobileQuoteRenderer />

    const currentContent = DASHBOARD_CONTENT[mode as 'purpose' | 'about']
    if (!currentContent) return null

    return (
        <motion.div
            key="mobile-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
        >
            <AnimatePresence mode="wait">
                {uiMode !== 'tree' ? (
                    <motion.div
                        key="mobile-home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full px-4"
                    >
                        {/* Mobile Stacked Deck replacing the previous list */}
                        <MobileStackedDeck
                            content={currentContent}
                            mode={mode as 'purpose' | 'about'}
                            isBright={isBright}
                            onInitialize={() => setUiMode('tree')}
                        />
                    </motion.div>
                ) : (
                    /* Full-Screen Tree Modal */
                    <motion.div
                        key="mobile-tree"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="fixed inset-0 z-[220] flex flex-col"
                        style={{ backgroundColor: isBright ? 'rgba(255,255,255,0.97)' : 'rgba(0,0,0,0.97)' }}
                    >
                        <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b"
                            style={{ borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
                        >
                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--muted-foreground)' }}>
                                SYSTEM TREE
                            </span>
                            <button
                                onClick={() => setUiMode('default')}
                                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                style={{
                                    backgroundColor: isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                    color: 'var(--foreground)',
                                }}
                            >
                                <XClose size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <InteractiveTree
                                data={currentContent.treeData}
                                onClose={() => setUiMode('default')}
                                standalone
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─── MOBILE STACKED DECK ───
function MobileStackedDeck({
    mode,
    content,
    isBright,
    onInitialize
}: {
    mode: 'purpose' | 'about';
    content: CardContent;
    isBright: boolean;
    onInitialize: () => void;
}) {
    const [stack, setStack] = useState<string[]>([])

    // Initialize/Reset Stack on mode change
    useEffect(() => {
        setStack(['cover', ...content.subCards.map(c => c.id)])
    }, [mode, content])

    if (stack.length === 0) return null

    const handleCardClick = (clickedId: string, index: number) => {
        // Haptic feedback for card interaction
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10)
        }

        if (index === 0) {
            // Cycle top to bottom
            setStack([...stack.slice(1), stack[0]])
        } else {
            // Bring to top
            setStack([clickedId, ...stack.filter(id => id !== clickedId)])
        }
    }

    // Fixed height for mobile stack
    const STACK_HEIGHT = "min-h-[500px]"

    return (
        <div className={cn("relative w-full perspective-1000 group", STACK_HEIGHT)} style={{ marginBottom: '100px' }}>
            <AnimatePresence>
                {stack.map((id, index) => {
                    const isCover = id === 'cover'
                    const subCard = content.subCards.find(c => c.id === id)

                    if (!isCover && !subCard) return null

                    return (
                        <motion.div
                            key={id}
                            layoutId={`mobile-${mode}-${id}`}
                            onClick={() => handleCardClick(id, index)}
                            initial={false}
                            animate={{
                                y: index * 12, // Subtle overflow stack effect
                                scale: 1 - index * 0.05,
                                zIndex: stack.length - index,
                                filter: index === 0 ? 'brightness(1.05)' : 'brightness(0.6) blur(0.5px)',
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 25
                            }}
                            className={cn(
                                "absolute top-0 left-0 w-full rounded-2xl cursor-pointer overflow-hidden transition-all duration-500",
                                STACK_HEIGHT,
                                "border-[1.5px] border-b-[4px] border-r-[2px]",
                                isBright
                                    ? "bg-white border-black/10 border-b-black/20 border-r-black/15 shadow-[var(--shadow-premium)]"
                                    : (isCover ? "bg-black border-white/20 border-b-white/30 border-r-white/25 shadow-[var(--shadow-premium)]" : "bg-[var(--card-bg)] backdrop-blur-3xl border-white/10 border-b-white/20 border-r-white/15 shadow-[var(--shadow-premium)]")
                            )}
                            style={{
                                transformOrigin: 'top center'
                            }}
                        >
                            {/* Card Content Wrapper */}
                            <div className={cn(
                                "w-full h-full px-6 py-8 flex flex-col justify-between relative",
                                isCover && !isBright ? "bg-[var(--card-bg)]" : ""
                            )}>
                                {/* Inner Shadow & Texture for Premium Dark Mode */}
                                {!isBright && (
                                    <>
                                        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none" />
                                        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                                    </>
                                )}

                                {isCover ? (
                                    // --- COVER CARD ---
                                    <>
                                        {/* Label (Moved to Right) */}
                                        <div className="absolute top-7 right-6 z-10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse" />
                                            <span className={cn(
                                                "text-sm font-bold tracking-tight uppercase",
                                                isBright ? "text-black/60" : "text-white/80"
                                            )}>
                                                {content.label}
                                            </span>
                                        </div>

                                        <div className="mt-14">
                                            {/* Main Info */}
                                            <h2 className={cn(
                                                "relative z-10 text-4xl font-black tracking-tighter leading-none mb-4",
                                                isBright ? "text-black" : "text-white"
                                            )}>
                                                {content.heading}
                                            </h2>
                                            <p className={cn(
                                                "relative z-10 text-base font-medium leading-relaxed",
                                                isBright ? "text-gray-600" : "text-gray-300"
                                            )}>
                                                {content.intro}
                                            </p>
                                        </div>

                                        {/* Footer / Action */}
                                        <div className="relative z-10 mt-auto pt-6 border-t border-white/5 w-full flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-xs font-bold font-mono tracking-wider uppercase",
                                                    isBright ? "text-black/30" : "text-white/30"
                                                )}>system_protocol</span>
                                                <span className={cn(
                                                    "text-xs font-bold font-mono tracking-wider mt-0.5",
                                                    isBright ? "text-cyan-600" : "text-cyan-400/50"
                                                )}>ACTIVE_EXECUTION</span>
                                            </div>

                                            {/* Action Button: Moved to Bottom Right */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onInitialize()
                                                }}
                                                className={cn(
                                                    "group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 shadow-xl active:scale-95",
                                                    isBright
                                                        ? "bg-[#111] text-white border-transparent hover:bg-black"
                                                        : "bg-[#111111] border-white/20 text-white hover:border-white/40 hover:bg-black"
                                                )}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:animate-pulse" />
                                                <span className="text-xs tracking-tight font-bold uppercase">
                                                    ELABORATE
                                                </span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // --- SUB CARD ---
                                    subCard && (
                                        <>
                                            <div className="flex-1 overflow-y-auto pr-1">
                                                {/* Top Label */}
                                                <div className="flex items-center justify-between mb-6 pointer-events-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
                                                        <span className={cn(
                                                            "text-[10px] font-bold tracking-wider uppercase",
                                                            isBright ? "text-black/60" : "text-white/60"
                                                        )}>
                                                            CRITICAL_MODULE 0{content.subCards.findIndex(c => c.id === id) + 1}
                                                        </span>
                                                    </div>
                                                    <div className={cn("w-8 h-px", isBright ? "bg-black/10" : "bg-white/10")} />
                                                </div>

                                                {/* Card Title */}
                                                <h3 className={cn(
                                                    "text-2xl font-black tracking-tighter mb-3",
                                                    isBright ? "text-black" : "text-white"
                                                )}>
                                                    {subCard.title}
                                                </h3>

                                                {/* Front Text */}
                                                <p className={cn(
                                                    "text-sm leading-relaxed mb-6 font-medium",
                                                    isBright ? "text-cyan-900" : "text-cyan-200/60"
                                                )}>
                                                    {subCard.frontText}
                                                </p>

                                                <div className="space-y-6">
                                                    {/* Context */}
                                                    <div>
                                                        <h4 className={cn(
                                                            "text-xs font-bold uppercase tracking-wider mb-2",
                                                            isBright ? "text-black/50" : "text-white/50"
                                                        )}>{subCard.contextLabel}</h4>
                                                        <p className={cn(
                                                            "text-xs leading-relaxed",
                                                            isBright ? "text-gray-700 font-medium" : "text-gray-400"
                                                        )}>{subCard.contextText}</p>
                                                    </div>

                                                    {/* Details */}
                                                    <div>
                                                        <h4 className={cn(
                                                            "text-xs font-bold uppercase tracking-wider mb-2",
                                                            isBright ? "text-black/50" : "text-white/50"
                                                        )}>{subCard.detailsLabel}</h4>
                                                        <ul className="space-y-2">
                                                            {subCard.details.map((detail, idx) => (
                                                                <li key={idx} className={cn(
                                                                    "flex items-center gap-2 text-xs",
                                                                    isBright ? "text-gray-700" : "text-gray-300/80"
                                                                )}>
                                                                    <div className={cn("w-1 h-1 rounded-full", isBright ? "bg-cyan-600" : "bg-cyan-500/50")} />
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className={cn(
                                                "mt-4 pt-4 border-t flex items-center justify-between shrink-0",
                                                isBright ? "border-black/5" : "border-white/5"
                                            )}>
                                                <div>
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase tracking-wider",
                                                        isBright ? "text-black/50" : "text-white/30"
                                                    )}>{subCard.footerLabel}</span>
                                                    <span className={cn(
                                                        "block text-xs font-bold italic",
                                                        isBright ? "text-gray-700" : "text-gray-400"
                                                    )}>"{subCard.footerText}"</span>
                                                </div>
                                                <span className={cn(
                                                    "font-mono text-xs tracking-wider uppercase",
                                                    isBright ? "text-cyan-800" : "text-cyan-500/40"
                                                )}>EXPANDED</span>
                                            </div>
                                        </>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>

            {/* Instruction Hint */}
            <div className="absolute -bottom-10 left-0 w-full flex justify-center pointer-events-none">
                <span className={cn(
                    "text-xs font-bold font-mono tracking-tighter uppercase animate-pulse",
                    isBright ? "text-black opacity-50" : "text-white/30"
                )}>
                    TAP_TO_SHUFFLE_STACK
                </span>
            </div>
        </div >
    )
}

// ─── MOBILE QUOTE RENDERER (Unchanged) ───
function MobileQuoteRenderer() {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
    const [displayPhase, setDisplayPhase] = useState<'display' | 'erasing' | 'paused' | 'typing'>('display')
    const [visibleText, setVisibleText] = useState(SYSTEM_QUOTES[0].text)
    const [visibleAuthor, setVisibleAuthor] = useState(SYSTEM_QUOTES[0].author)

    const ERASE_SPEED_MS = 20
    const TYPE_SPEED_MS = 25
    const PAUSE_DURATION_MS = 150
    const DISPLAY_DURATION_MS = 10000

    useEffect(() => {
        let timeoutId: NodeJS.Timeout
        const runCycle = () => {
            if (displayPhase === 'display') {
                timeoutId = setTimeout(() => setDisplayPhase('erasing'), DISPLAY_DURATION_MS)
            } else if (displayPhase === 'erasing') {
                if (visibleText.length > 0) {
                    timeoutId = setTimeout(() => {
                        setVisibleText(prev => prev.slice(0, -1))
                        if (visibleText.length < 5) setVisibleAuthor('')
                    }, ERASE_SPEED_MS)
                } else setDisplayPhase('paused')
            } else if (displayPhase === 'paused') {
                timeoutId = setTimeout(() => {
                    const nextIndex = (currentQuoteIndex + 1) % SYSTEM_QUOTES.length
                    setCurrentQuoteIndex(nextIndex); setVisibleAuthor('')
                    setDisplayPhase('typing')
                }, PAUSE_DURATION_MS)
            } else if (displayPhase === 'typing') {
                const target = SYSTEM_QUOTES[currentQuoteIndex]
                if (visibleText.length < target.text.length) {
                    timeoutId = setTimeout(() => setVisibleText(target.text.slice(0, visibleText.length + 1)), TYPE_SPEED_MS)
                } else { setVisibleAuthor(target.author); setDisplayPhase('display') }
            }
        }
        runCycle()
        return () => clearTimeout(timeoutId)
    }, [displayPhase, visibleText, currentQuoteIndex])

    return (
        <div className="w-full px-4 pb-8 h-[500px] flex items-center">
            <div className={cn(
                "w-full rounded-2xl overflow-hidden transition-colors duration-300 px-6 py-10 flex flex-col items-center justify-center text-center h-full",
                "border-[1.5px] border-b-[4px] border-r-[2px] shadow-[var(--shadow-premium)]",
                renderMode === 'bright'
                    ? "bg-white/90 border-black/10 border-b-black/20 border-r-black/15"
                    : "bg-black/60 backdrop-blur-xl border-white/10 border-b-white/20 border-r-white/15"
            )}>
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]",
                        displayPhase === 'typing' ? "bg-white animate-pulse" : "bg-cyan-400"
                    )} />
                    <span className="text-xs font-bold tracking-wider text-cyan-200/70 uppercase">SYSTEM_MEMORY</span>
                </div>

                <div className="max-w-lg">
                    <h2 className={cn(
                        "text-2xl font-extrabold leading-tight tracking-tighter",
                        isBright ? "text-black/95" : "text-white/95"
                    )}>
                        "{visibleText}"
                        <span className={cn("inline-block w-2 h-6 bg-cyan-500/50 align-middle ml-1", displayPhase === 'display' ? "opacity-0" : "animate-pulse")} />
                    </h2>
                    <div className="h-6 mt-4">
                        {visibleAuthor && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(
                                "text-sm font-medium uppercase",
                                isBright ? "text-black/40" : "text-white/40"
                            )}>
                                — {visibleAuthor}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
