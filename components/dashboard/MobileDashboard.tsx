'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { InteractiveTree, TreeNode } from '@/components/visuals/InteractiveTree'
import { X as XClose, ChevronRight } from 'lucide-react'

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
                        className="w-full px-4 pb-8"
                    >
                        {/* Main Card */}
                        <MobilePrimaryCard content={currentContent} isPrecision={usePrecisionStyle} isBright={isBright} />

                        {/* Sub Cards */}
                        <div className="mt-4 flex flex-col gap-3">
                            {currentContent.subCards.map((sub, idx) => (
                                <MobileSubCard key={sub.id} subCard={sub} index={idx} isPrecision={usePrecisionStyle} isBright={isBright} />
                            ))}
                        </div>

                        {/* Tree Button */}
                        <motion.button
                            onClick={() => setUiMode('tree')}
                            className="fixed bottom-24 left-5 z-[180] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl active:scale-90 transition-transform"
                            style={{
                                backgroundColor: isBright ? '#fff' : '#0f0f0f',
                                border: isBright ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(16,185,129,0.3)',
                                boxShadow: isBright ? '0 8px 30px rgba(0,0,0,0.1)' : '0 8px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16,185,129,0.1)',
                            }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                            <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: isBright ? '#111' : '#a5f3fc' }}>
                                View Tree
                            </span>
                        </motion.button>
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


// ─── MOBILE PRIMARY CARD ───
function MobilePrimaryCard({ content, isPrecision, isBright }: { content: CardContent; isPrecision: boolean; isBright: boolean }) {
    return (
        <div className={cn(
            "w-full rounded-2xl overflow-hidden border transition-colors duration-300 px-6 py-8",
            isPrecision ? "bg-black border-white" : (isBright ? "bg-white/90 border-black/10 shadow-xl" : "bg-black/60 backdrop-blur-xl border-white/10")
        )}>
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                <span className="text-[10px] font-medium tracking-wider text-white/70 uppercase">{content.label}</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-black tracking-tighter leading-none" style={{ color: 'var(--heading-primary)' }}>
                {content.heading}
            </h2>

            {/* Intro */}
            <p className="mt-4 text-sm text-gray-300/75 font-light leading-relaxed">
                {content.intro}
            </p>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-white/30 tracking-wider uppercase">system_protocol</span>
                    <span className="text-[9px] font-mono text-cyan-400/50 tracking-wider mt-0.5">ACTIVE_EXECUTION</span>
                </div>
            </div>
        </div>
    )
}


// ─── MOBILE SUB CARD ───
function MobileSubCard({ subCard, index, isPrecision, isBright }: {
    subCard: SubCardContent; index: number; isPrecision: boolean; isBright: boolean
}) {
    const [expanded, setExpanded] = useState(false)

    return (
        <motion.div
            layout
            className={cn(
                "w-full rounded-xl overflow-hidden border transition-colors duration-300",
                isPrecision ? "bg-black border-white/20" : (isBright ? "bg-white border-black/8 shadow-md" : "bg-black/40 backdrop-blur-md border-white/8")
            )}
        >
            {/* Header - Tap to expand */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-5 py-4 text-left active:opacity-80"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase">
                        MODULE 0{index + 1}
                    </span>
                    <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                        {subCard.title}
                    </span>
                </div>
                <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
                </motion.div>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-4">
                            <p className="text-xs text-cyan-200/60 leading-relaxed">{subCard.frontText}</p>

                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">{subCard.contextLabel}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">{subCard.contextText}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">{subCard.detailsLabel}</h4>
                                <ul className="space-y-1.5">
                                    {subCard.details.map((d, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[11px] text-gray-300/80">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500/50" /> {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">{subCard.footerLabel}</span>
                                    <span className="block text-[10px] text-gray-400 italic">"{subCard.footerText}"</span>
                                </div>
                                <span className="text-cyan-500/40 font-mono text-[8px] tracking-wider uppercase">EXPANDED</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}


// ─── MOBILE QUOTE RENDERER ───
function MobileQuoteRenderer({ isPrecision }: { isPrecision: boolean }) {
    const { renderMode } = useUI()
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
        <div className="w-full px-4 pb-8">
            <div className={cn(
                "w-full rounded-2xl overflow-hidden border transition-colors duration-300 px-6 py-10 flex flex-col items-center justify-center text-center min-h-[280px]",
                isPrecision ? "bg-black border-white"
                    : (renderMode === 'bright' ? "bg-white/90 border-black/10" : "bg-black/60 backdrop-blur-xl border-white/10")
            )}>
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]",
                        displayPhase === 'typing' ? "bg-white animate-pulse" : "bg-cyan-400"
                    )} />
                    <span className="text-[10px] font-bold tracking-wider text-cyan-200/70 uppercase">SYSTEM_MEMORY</span>
                </div>

                <div className="max-w-lg">
                    <h2 className="text-2xl font-extrabold leading-tight text-white/95 tracking-tighter">
                        "{visibleText}"
                        <span className={cn("inline-block w-2 h-6 bg-cyan-500/50 align-middle ml-1", displayPhase === 'display' ? "opacity-0" : "animate-pulse")} />
                    </h2>
                    <div className="h-6 mt-4">
                        {visibleAuthor && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-white/40 uppercase">
                                — {visibleAuthor}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
