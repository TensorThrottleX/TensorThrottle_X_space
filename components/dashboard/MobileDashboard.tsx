'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { InteractiveTree, TreeNode } from '@/components/visuals/InteractiveTree'
import { X as XClose } from 'lucide-react'

// ─── TYPES ───
interface SubCardContent {
    id: string; title: string; frontText: string
    contextLabel: string; contextText: string
    detailsLabel: string; details: string[]
    footerLabel: string; footerText: string
}
interface CardContent {
    label: string; heading: string; intro: string
    subCards: SubCardContent[]; treeData: TreeNode
}
interface QuoteData { text: string; author?: string }

// ─── DATA (shared with desktop) ───
const SYSTEM_QUOTES: QuoteData[] = [
    { text: "Those who cannot acknowledge themselves will eventually fail.", author: "Itachi Uchiha" },
    { text: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy" },
    { text: "Push through the pain. Giving up hurts more.", author: "Vegeta" },
    { text: "No matter how deep the night, it always turns to day.", author: "Brook" },
    { text: "The world isn't perfect. But it's there for us, trying the best it can.", author: "Roy Mustang" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
    { text: "Power comes in response to a need, you have to create that need", author: "Son Goku" }
]

const contentMap: Record<'purpose' | 'about', CardContent> = {
    purpose: {
        label: 'PURPOSE', heading: 'SYSTEM MOTIVE',
        intro: 'Operational reasoning behind this platform — its design philosophy, and long-term execution trajectory.',
        subCards: [
            { id: 'intent', title: 'INTENT PROTOCOL', frontText: 'An operational layer for exposing intent, decisions, and system thinking in motion.', contextLabel: 'Definition', contextText: 'This platform documents thinking as it evolves — not just final outputs.', detailsLabel: 'What Is Shown', details: ['Architectural intent', 'Decision logic', 'Trade-offs', 'Iterations'], footerLabel: 'Position', footerText: 'Transparency over polish.' },
            { id: 'motion', title: 'DESIGN IN MOTION', frontText: 'A live environment where ideas move from abstraction to execution.', contextLabel: 'Core Function', contextText: 'Concept → Model → System → Refinement', detailsLabel: 'What You Will See', details: ['Draft architectures', 'Experimental flows', 'Refactoring decisions', 'Incomplete frameworks'], footerLabel: 'Philosophy', footerText: 'Systems should be seen while forming.' },
            { id: 'systems', title: 'HALF-BUILT SYSTEMS', frontText: 'Structured exposure of unfinished but intentional constructs.', contextLabel: 'Why Incomplete Matters', contextText: 'Half-built systems reveal real reasoning.', detailsLabel: 'Displayed', details: ['Early blueprints', 'Prototype states', 'Failed branches', 'Versioned attempts'], footerLabel: 'Principle', footerText: 'Clarity > perfection.' },
            { id: 'execution', title: 'EXECUTION TRACE', frontText: 'Traceable action from idea conception to operational implementation.', contextLabel: 'What Is Logged', contextText: 'Visible execution trail, not just a result snapshot.', detailsLabel: 'Logged Items', details: ['Intent', 'Implementation', 'Adjustment', 'Stabilization'], footerLabel: 'Outcome', footerText: 'A visible execution trail.' },
        ],
        treeData: {
            name: "TensorThrottleX System Core", children: [
                { name: "Intent Protocol", children: [{ name: "Defines operational reasoning" }, { name: "Establishes architectural direction" }] },
                { name: "Design in Motion", children: [{ name: "Transforms abstraction into structure" }, { name: "Documents evolving system states" }] },
                { name: "Half-Built Systems", children: [{ name: "Exposes thinking before polish" }, { name: "Reveals iteration cycles" }] },
                { name: "Execution Trace", children: [{ name: "Tracks implementation decisions" }, { name: "Connects intent to outcome" }] }
            ]
        }
    },
    about: {
        label: 'ABOUT', heading: 'Data & Machine Learning Research',
        intro: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.',
        subCards: [
            { id: 'primary', title: 'Data & ML Research', frontText: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.', contextLabel: 'Work', contextText: 'Building experimental frameworks and research-aligned pipelines.', detailsLabel: 'Core', details: ['Machine Learning Systems', 'Statistical Modeling', 'Data Engineering Pipelines', 'AI Architecture & Research'], footerLabel: 'Direction', footerText: 'Framework discovery.' },
            { id: 'explorer', title: 'Experimental Explorer', frontText: 'Designing and testing ML architectures through iterative experimentation.', contextLabel: 'Research', contextText: 'Emphasis on hypothesis-driven development and measurable model refinement.', detailsLabel: 'Process', details: ['Validation Cycles', 'Performance Benchmarking', 'Hypothesis Testing', 'Iterative Refinement'], footerLabel: 'Motive', footerText: 'Refinement over adoption.' },
            { id: 'builder', title: 'Applied ML Builder', frontText: 'Engineering end-to-end data pipelines — from preprocessing to deployment.', contextLabel: 'Engineering', contextText: 'Focused on reproducibility, scalability, and execution discipline.', detailsLabel: 'Technical Focus', details: ['Data Pipelines', 'Feature Engineering', 'Optimization', 'Execution Discipline'], footerLabel: 'Motive', footerText: 'Reproducible intelligence.' },
        ],
        treeData: {
            name: "TensorThrottleX", children: [
                { name: "Data Intelligence", children: [{ name: "Statistical Modeling" }, { name: "Signal Extraction" }, { name: "Feature Engineering" }, { name: "Data Pipelines" }] },
                { name: "Machine Learning Systems", children: [{ name: "Deep Learning" }, { name: "Representation Learning" }, { name: "Optimization Strategies" }, { name: "LLM-Oriented Systems" }] },
                { name: "Research Orientation", children: [{ name: "Hypothesis-Driven Development" }, { name: "Experimental Iteration" }, { name: "Model Validation" }, { name: "Benchmarking Frameworks" }] },
            ]
        }
    }
}


// ─── MOBILE DASHBOARD ───
interface MobileDashboardProps { mode?: 'purpose' | 'about' | 'quote' }

export function MobileDashboard({ mode = 'purpose' }: MobileDashboardProps) {
    const { uiMode, setUiMode, renderMode, isPrecision } = useUI()
    const isBright = renderMode === 'bright'
    const usePrecisionStyle = isPrecision || (renderMode === 'normal' && !isBright)

    useEffect(() => { if (uiMode === 'tree') setUiMode('default') }, [mode])

    if (mode === 'quote') return <MobileQuoteRenderer isPrecision={usePrecisionStyle} />

    const currentContent = contentMap[mode as 'purpose' | 'about']
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
                            isPrecision={usePrecisionStyle}
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
    isPrecision,
    isBright,
    onInitialize
}: {
    mode: 'purpose' | 'about';
    content: CardContent;
    isPrecision: boolean;
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
                                "absolute top-0 left-0 w-full rounded-2xl cursor-pointer shadow-xl overflow-hidden border transition-colors duration-300",
                                STACK_HEIGHT,
                                isPrecision
                                    ? "bg-black border-white"
                                    : (isBright ? "bg-white/95 border-black/10" : "bg-black/80 backdrop-blur-xl border-white")
                            )}
                            style={{
                                transformOrigin: 'top center'
                            }}
                        >
                            {/* Card Content Wrapper */}
                            <div className={cn(
                                "w-full h-full px-6 py-8 flex flex-col justify-between relative",
                                isCover && !isPrecision && !isBright ? "bg-[#050505]" : ""
                            )}>
                                {/* Inner Shadow for Cover (Dark Mode) */}
                                {isCover && !isPrecision && !isBright && (
                                    <>
                                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                                    </>
                                )}

                                {isCover ? (
                                    // --- COVER CARD ---
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onInitialize()
                                            }}
                                            className={cn(
                                                "absolute top-6 left-6 z-50 group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-lg",
                                                isBright
                                                    ? "bg-[#111] text-white border-transparent hover:bg-black"
                                                    : "bg-[#0B0B0B] border-white/10 hover:border-white/20 hover:bg-[#111]"
                                            )}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                            <span className="text-[10px] tracking-normal font-medium">
                                                ELABORATE
                                            </span>
                                        </button>

                                        {/* Label (Moved to Right) */}
                                        <div className="absolute top-7 right-6 z-10 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                            <span className={cn(
                                                "text-[10px] font-medium tracking-wide uppercase",
                                                isBright ? "text-black/60" : "text-white/70"
                                            )}>
                                                {content.label}
                                            </span>
                                        </div>

                                        <div className="mt-14">
                                            {/* Main Info */}
                                            <h2 className={cn(
                                                "relative z-10 text-3xl font-black tracking-tighter leading-none mb-4",
                                                isBright ? "text-black" : "text-white"
                                            )}>
                                                {content.heading}
                                            </h2>
                                            <p className={cn(
                                                "relative z-10 text-sm font-light leading-relaxed",
                                                isBright ? "text-gray-600" : "text-gray-300/75"
                                            )}>
                                                {content.intro}
                                            </p>
                                        </div>

                                        {/* Footer / Action */}
                                        <div className="relative z-10 mt-auto pt-6 border-t border-white/5 w-full flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-mono text-white/30 tracking-wider uppercase">system_protocol</span>
                                                <span className="text-[9px] font-mono text-cyan-400/50 tracking-wider mt-0.5">ACTIVE_EXECUTION</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // --- SUB CARD ---
                                    subCard && (
                                        <>
                                            <div className="flex-1 overflow-y-auto pr-1">
                                                {/* Top Label */}
                                                <div className="flex items-center justify-between mb-6 pointer-events-none">
                                                    <span className={cn(
                                                        "text-[9px] font-bold tracking-wider uppercase",
                                                        isBright ? "text-black/40" : "text-white/30"
                                                    )}>
                                                        MODULE 0{content.subCards.findIndex(c => c.id === id) + 1}
                                                    </span>
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
                                                    isBright ? "text-cyan-700/80" : "text-cyan-200/60"
                                                )}>
                                                    {subCard.frontText}
                                                </p>

                                                <div className="space-y-6">
                                                    {/* Context */}
                                                    <div>
                                                        <h4 className={cn(
                                                            "text-[9px] font-bold uppercase tracking-wider mb-2",
                                                            isBright ? "text-black/50" : "text-white/50"
                                                        )}>{subCard.contextLabel}</h4>
                                                        <p className={cn(
                                                            "text-xs leading-relaxed",
                                                            isBright ? "text-gray-600" : "text-gray-400"
                                                        )}>{subCard.contextText}</p>
                                                    </div>

                                                    {/* Details */}
                                                    <div>
                                                        <h4 className={cn(
                                                            "text-[9px] font-bold uppercase tracking-wider mb-2",
                                                            isBright ? "text-black/50" : "text-white/50"
                                                        )}>{subCard.detailsLabel}</h4>
                                                        <ul className="space-y-2">
                                                            {subCard.details.map((detail, idx) => (
                                                                <li key={idx} className={cn(
                                                                    "flex items-center gap-2 text-xs",
                                                                    isBright ? "text-gray-700" : "text-gray-300/80"
                                                                )}>
                                                                    <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between shrink-0">
                                                <div>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">{subCard.footerLabel}</span>
                                                    <span className="block text-[10px] text-gray-400 italic">"{subCard.footerText}"</span>
                                                </div>
                                                <span className="text-cyan-500/40 font-mono text-[8px] tracking-wider uppercase">EXPANDED</span>
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
                    "text-[9px] font-black font-mono tracking-tighter uppercase animate-pulse",
                    isBright ? "text-black opacity-50" : "text-white/30"
                )}>
                    TAP_TO_SHUFFLE_STACK
                </span>
            </div>
        </div >
    )
}

// ─── MOBILE QUOTE RENDERER (Unchanged) ───
function MobileQuoteRenderer({ isPrecision }: { isPrecision: boolean }) {
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
                "w-full rounded-2xl overflow-hidden border transition-colors duration-300 px-6 py-10 flex flex-col items-center justify-center text-center h-full",
                isPrecision ? "bg-black border-white"
                    : (renderMode === 'bright' ? "bg-white/90 border-black/10" : "bg-black/60 backdrop-blur-xl border-white")
            )}>
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]",
                        displayPhase === 'typing' ? "bg-white animate-pulse" : "bg-cyan-400"
                    )} />
                    <span className="text-[10px] font-bold tracking-wider text-cyan-200/70 uppercase">SYSTEM_MEMORY</span>
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
                                "text-xs font-medium uppercase",
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
