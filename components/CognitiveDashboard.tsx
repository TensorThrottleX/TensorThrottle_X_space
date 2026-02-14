'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { InteractiveTree, TreeNode } from '@/components/InteractiveTree'

// --- Types ---

interface SubCardContent {
    id: string
    title: string
    frontText: string
    contextLabel: string
    contextText: string
    detailsLabel: string
    details: string[]
    footerLabel: string
    footerText: string
}

interface CardContent {
    label: string
    heading: string
    intro: string
    subCards: SubCardContent[]
    treeData: TreeNode
}

interface QuoteData {
    text: string
    author?: string
}

// --- Data ---
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

const contentMap: Record<'purpose' | 'about', CardContent> = {
    purpose: {
        label: 'PURPOSE',
        heading: 'SYSTEM MOTIVE',
        intro: 'Operational reasoning behind this platform — its design philosophy, and long-term execution trajectory.',
        subCards: [
            {
                id: 'intent',
                title: 'INTENT PROTOCOL',
                frontText: 'An operational layer for exposing intent, decisions, and system thinking in motion.',
                contextLabel: 'Definition',
                contextText: 'This platform documents thinking as it evolves — not just final outputs.',
                detailsLabel: 'What Is Shown',
                details: ['Architectural intent', 'Decision logic', 'Trade-offs', 'Iterations'],
                footerLabel: 'Position',
                footerText: 'Transparency over polish.'
            },
            {
                id: 'motion',
                title: 'DESIGN IN MOTION',
                frontText: 'A live environment where ideas move from abstraction to execution.',
                contextLabel: 'Core Function',
                contextText: 'Concept → Model → System → Refinement',
                detailsLabel: 'What You Will See',
                details: ['Draft architectures', 'Experimental flows', 'Refactoring decisions', 'Incomplete frameworks'],
                footerLabel: 'Philosophy',
                footerText: 'Systems should be seen while forming.'
            },
            {
                id: 'systems',
                title: 'HALF-BUILT SYSTEMS',
                frontText: 'Structured exposure of unfinished but intentional constructs.',
                contextLabel: 'Why Incomplete Matters',
                contextText: 'Half-built systems reveal real reasoning.',
                detailsLabel: 'Displayed',
                details: ['Early blueprints', 'Prototype states', 'Failed branches', 'Versioned attempts'],
                footerLabel: 'Principle',
                footerText: 'Clarity > perfection.'
            },
            {
                id: 'execution',
                title: 'EXECUTION TRACE',
                frontText: 'Traceable action from idea conception to operational implementation.',
                contextLabel: 'What Is Logged',
                contextText: 'Visible execution trail, not just a result snapshot.',
                detailsLabel: 'Logged Items',
                details: ['Intent', 'Implementation', 'Adjustment', 'Stabilization'],
                footerLabel: 'Outcome',
                footerText: 'A visible execution trail.'
            },
            {
                id: 'workflow',
                title: 'System Workflow Architecture',
                frontText: 'A structured overview of how intent, exploration, systems, and execution interconnect across the platform.',
                contextLabel: 'Flow',
                contextText: 'Demonstrates the logical interconnection between system motives and terminal execution.',
                detailsLabel: 'System Logic',
                details: ['Intent → Architecture', 'Motion → Evolution', 'Prototype → Reasoning', 'Trace → Outcome'],
                footerLabel: 'Operational',
                footerText: 'System Coherent.'
            }
        ],
        treeData: {
            name: "TensorThrottleX System Core",
            children: [
                {
                    name: "Intent Protocol",
                    children: [
                        { name: "Defines operational reasoning" },
                        { name: "Establishes architectural direction" }
                    ]
                },
                {
                    name: "Design in Motion",
                    children: [
                        { name: "Transforms abstraction into structure" },
                        { name: "Documents evolving system states" }
                    ]
                },
                {
                    name: "Half-Built Systems",
                    children: [
                        { name: "Exposes thinking before polish" },
                        { name: "Reveals iteration cycles" }
                    ]
                },
                {
                    name: "Execution Trace",
                    children: [
                        { name: "Tracks implementation decisions" },
                        { name: "Connects intent to outcome" }
                    ]
                }
            ]
        }
    },
    about: {
        label: 'ABOUT',
        heading: 'Data & Machine Learning Research',
        intro: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.',
        subCards: [
            {
                id: 'primary',
                title: 'Data & ML Research',
                frontText: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.',
                contextLabel: 'Work',
                contextText: 'Building experimental frameworks and research-aligned pipelines that convert complex datasets into interpretable and scalable intelligence. Work revolves around iterative modeling, statistical reasoning, and architecture-driven system design.',
                detailsLabel: 'Core',
                details: ['Machine Learning Systems', 'Statistical Modeling', 'Data Engineering Pipelines', 'AI Architecture & Research'],
                footerLabel: 'Direction',
                footerText: 'Framework discovery.'
            },
            {
                id: 'explorer',
                title: 'Experimental Model Explorer',
                frontText: 'Designing and testing ML architectures through iterative experimentation, validation cycles, and performance benchmarking.',
                contextLabel: 'Research',
                contextText: 'Emphasis on hypothesis-driven development and measurable model refinement.',
                detailsLabel: 'Process',
                details: ['Validation Cycles', 'Performance Benchmarking', 'Hypothesis Testing', 'Iterative Refinement'],
                footerLabel: 'Motive',
                footerText: 'Refinement over adoption.'
            },
            {
                id: 'builder',
                title: 'Applied ML Systems Builder',
                frontText: 'Engineering end-to-end data pipelines — from preprocessing and feature engineering to deployment.',
                contextLabel: 'Engineering',
                contextText: 'Focused on reproducibility, scalability, and execution discipline.',
                detailsLabel: 'Technical Focus',
                details: ['Data Pipelines', 'Feature Engineering', 'Optimization', 'Execution Discipline'],
                footerLabel: 'Motive',
                footerText: 'Reproducible intelligence.'
            },
            {
                id: 'research',
                title: 'AI Research-Oriented Explorer',
                frontText: 'Exploring advanced AI domains including statistical modeling, deep learning, and LLM-integrated systems.',
                contextLabel: 'Vision',
                contextText: 'Committed to long-horizon research depth over short-term trend adoption.',
                detailsLabel: 'Domains',
                details: ['Deep Learning', 'Statistical Modeling', 'LLM Architectures', 'Core Research'],
                footerLabel: 'Position',
                footerText: 'Long-horizon depth.'
            }
        ],
        treeData: {
            name: "TensorThrottleX",
            children: [
                {
                    name: "Data Intelligence",
                    children: [
                        { name: "Statistical Modeling", children: [{ name: "Statistical Learning Enthusiast" }] },
                        { name: "Signal Extraction", children: [{ name: "Statistical Learning Enthusiast" }] },
                        { name: "Feature Engineering", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Data Pipelines", children: [{ name: "Infrastructure Curiosity" }] }
                    ]
                },
                {
                    name: "Machine Learning Systems",
                    children: [
                        { name: "Deep Learning", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Representation Learning", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Optimization Strategies", children: [{ name: "ML Optimization Interest" }] },
                        { name: "LLM-Oriented Systems", children: [{ name: "LLM Systems Explorer" }] }
                    ]
                },
                {
                    name: "Research Orientation",
                    children: [
                        { name: "Hypothesis-Driven Development", children: [{ name: "Research Interest" }] },
                        { name: "Experimental Iteration", children: [{ name: "Active Exploration" }] },
                        { name: "Model Validation", children: [{ name: "Experimental Focus" }] },
                        { name: "Benchmarking Frameworks", children: [{ name: "Research Interest" }] }
                    ]
                },
                {
                    name: "System Philosophy",
                    children: [
                        { name: "Architecture Before Code", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Structured Complexity", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Framework Creation", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Long-Horizon Building", children: [{ name: "Systems Architecture Aficionado" }] }
                    ]
                }
            ]
        }
    }
}

// --- Components ---

interface CognitiveDashboardProps {
    mode?: 'purpose' | 'about' | 'quote'
}

/* HOME > COGNITIVE_DASHBOARD > COMPONENT > MAIN_CONTAINER */
export function CognitiveDashboard({ mode = 'purpose' }: CognitiveDashboardProps): React.ReactNode {
    const { uiMode, setUiMode, renderMode } = useUI()
    const isPrecision = renderMode === 'normal'
    const isBright = renderMode === 'bright'

    /* HOME > COGNITIVE_DASHBOARD > STATE > TREE_RESET */
    useEffect(() => {
        if (uiMode === 'tree') setUiMode('default')
    }, [mode])


    // Removal of redundant if check as it's handled in the return block

    // If mode is quote, we render the Advanced System Quote Renderer
    if (mode === 'quote') {
        return (
            <motion.div
                key="quote"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-x-0 top-[260px] bottom-0 flex flex-col items-center justify-start pointer-events-none z-0"
            >
                <div className="relative pointer-events-auto w-full flex justify-center px-4">
                    <SystemQuoteRenderer isPrecision={isPrecision} />
                </div>
            </motion.div>
        )
    }

    const currentContent = contentMap[mode as 'purpose' | 'about']

    if (!currentContent) return null

    return (
        <motion.div
            key="cognitive-dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
        >
            <AnimatePresence mode="wait">
                {uiMode !== 'tree' ? (
                    /* MAIN LAYOUT */
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-x-0 top-[260px] bottom-0 flex flex-col items-center justify-start pointer-events-none z-0"
                    >
                        <div className="relative pointer-events-auto w-full flex justify-center px-4">
                            <StackedDeck
                                mode={mode}
                                content={currentContent}
                                isPrecision={isPrecision}
                                isBright={isBright}
                                onInitialize={() => setUiMode('tree')}
                            />
                        </div>
                    </motion.div>
                ) : (
                    /* TREE LAYOUT */
                    <InteractiveTree
                        key="tree"
                        data={currentContent.treeData}
                        onClose={() => setUiMode('default')}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* QUOTE > SYSTEM_QUOTE_RENDERER > COMPONENT > ANIMATION_SYSTEM */
function SystemQuoteRenderer({ isPrecision }: { isPrecision: boolean }): React.ReactNode {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
    const [displayPhase, setDisplayPhase] = useState<'display' | 'erasing' | 'paused' | 'typing'>('display')
    const [visibleText, setVisibleText] = useState(SYSTEM_QUOTES[0].text)
    const [visibleAuthor, setVisibleAuthor] = useState(SYSTEM_QUOTES[0].author)

    // Animation Constants
    const ERASE_SPEED_MS = 20 // Fast erase (approx 1.2s for 60 chars)
    const TYPE_SPEED_MS = 25  // Fast typing (approx 1.5s for 60 chars)
    const PAUSE_DURATION_MS = 150
    const DISPLAY_DURATION_MS = 10000

    /* QUOTE > SYSTEM_QUOTE_RENDERER > ANIMATION > CYCLE_CONTROLLER */
    useEffect(() => {
        let timeoutId: NodeJS.Timeout

        const runCycle = () => {
            const currentQuote = SYSTEM_QUOTES[currentQuoteIndex]

            if (displayPhase === 'display') {
                // Wait for strict 10s display time
                timeoutId = setTimeout(() => {
                    setDisplayPhase('erasing')
                }, DISPLAY_DURATION_MS)
            }
            else if (displayPhase === 'erasing') {
                if (visibleText.length > 0) {
                    timeoutId = setTimeout(() => {
                        setVisibleText(prev => prev.slice(0, -1))
                        // Also erase author if text is gone
                        if (visibleText.length < 5) setVisibleAuthor('')
                    }, ERASE_SPEED_MS)
                } else {
                    setDisplayPhase('paused')
                }
            }
            else if (displayPhase === 'paused') {
                timeoutId = setTimeout(() => {
                    // Switch to next quote logic
                    const nextIndex = (currentQuoteIndex + 1) % SYSTEM_QUOTES.length
                    setCurrentQuoteIndex(nextIndex)
                    setVisibleAuthor('') // Ensure author is hidden
                    setDisplayPhase('typing')
                }, PAUSE_DURATION_MS)
            }
            else if (displayPhase === 'typing') {
                const targetQuote = SYSTEM_QUOTES[currentQuoteIndex]
                if (visibleText.length < targetQuote.text.length) {
                    timeoutId = setTimeout(() => {
                        setVisibleText(targetQuote.text.slice(0, visibleText.length + 1))
                    }, TYPE_SPEED_MS)
                } else {
                    // Text done, show author and switch to display
                    setVisibleAuthor(targetQuote.author)
                    setDisplayPhase('display')
                }
            }
        }

        runCycle()

        return () => clearTimeout(timeoutId)
    }, [displayPhase, visibleText, currentQuoteIndex])

    return (
        <div className={cn(
            "relative w-full max-w-[900px] h-[450px] rounded-[24px] shadow-2xl overflow-hidden border transition-colors duration-300 flex flex-col items-center justify-center text-center p-12",
            isPrecision
                ? "bg-black border-white"
                : "bg-black/60 backdrop-blur-xl border-white/10"
        )}>
            {/* Quote Label */}
            <div className="absolute top-10 left-10 flex items-center gap-3">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-colors duration-300",
                    displayPhase === 'typing' ? "bg-white animate-pulse" : "bg-cyan-400"
                )} />
                <span className="text-[11px] font-bold tracking-[0.25em] text-cyan-200/70 uppercase">
                    SYSTEM_MEMORY
                </span>
            </div>

            {/* Quote Content */}
            <div className="max-w-2xl min-h-[180px] flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-light leading-relaxed text-white/85 tracking-wide">
                    "{visibleText}"<span className={cn("inline-block w-2.5 h-8 bg-cyan-500/50 align-middle ml-1", displayPhase === 'display' ? "opacity-0" : "animate-pulse")}></span>
                </h2>
                <div className="h-8 mt-8">
                    {visibleAuthor && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-medium tracking-widest text-white/40 uppercase"
                        >
                            — {visibleAuthor}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Footer/Decoration */}
            <div className="absolute bottom-10 w-full flex justify-center opacity-20">
                <div className="w-16 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Progress Bar for Display Phase */}
            {displayPhase === 'display' && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-500/30"
                    style={{
                        width: '100%',
                        transition: `width ${DISPLAY_DURATION_MS}ms linear`
                    }}
                >
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

/* HOME > STACKED_DECK > COMPONENT > INTERACTIVE_STACK */
function StackedDeck({
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
}): React.ReactNode {
    // Stack State: Array of IDs. 'cover' is the main card.
    // content.subCards have ids.
    const [stack, setStack] = useState<string[]>([])

    /* HOME > STACKED_DECK > STATE > RESET_STACK */
    useEffect(() => {
        const initialStack = ['cover', ...content.subCards.map(c => c.id)]
        setStack(initialStack)
    }, [mode, content])

    if (stack.length === 0) return null

    /* HOME > STACKED_DECK > HANDLER > CARD_SELECTION */
    const handleCardClick = (clickedId: string, index: number) => {
        if (index === 0) {
            // If Top Card Clicked -> Move to Bottom (Serial Shuffle)
            const newStack = [...stack.slice(1), stack[0]]
            setStack(newStack)
        } else {
            // If Lower Card Clicked -> Bring to Top
            const newStack = [clickedId, ...stack.filter(id => id !== clickedId)]
            setStack(newStack)
        }
    }

    return (
        <div className="relative w-full max-w-[900px] min-h-[600px] perspective-1000 group flex flex-col items-center">
            <div className="relative w-full h-[480px]">
                <AnimatePresence>
                    {stack.map((id, index) => {
                        // Determine what to render based on ID
                        const isCover = id === 'cover'
                        const subCard = content.subCards.find(c => c.id === id)

                        return (
                            <motion.div
                                key={id}
                                layoutId={`${mode}-${id}`} // Unique layout ID for smooth transitions
                                onClick={() => handleCardClick(id, index)}
                                initial={false}
                                animate={{
                                    y: index * 14, // Reduced vertical offset to save space
                                    scale: 1 - index * 0.04, // Scale reduction
                                    zIndex: stack.length - index,
                                    filter: index === 0 ? 'brightness(1.05)' : 'brightness(0.6) blur(0.5px)', // Dim lower cards
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25
                                }}
                                className={cn(
                                    "absolute top-0 left-0 w-full h-[450px] rounded-[24px] cursor-pointer shadow-2xl overflow-hidden border transition-colors duration-300",
                                    isPrecision
                                        ? "bg-black border-white"
                                        : "bg-black/60 backdrop-blur-xl border-white/10"
                                )}
                                style={{
                                    transformOrigin: 'top center'
                                }}
                            >
                                {/* Card Content Wrapper */}
                                <div className={cn(
                                    "w-full h-full p-10 flex flex-col justify-between relative",
                                    isCover && !isPrecision ? "bg-[#050505]" : "" // Deep black for intent protocol
                                )}>

                                    {/* Inner Shadow & Noise for Cover */}
                                    {isCover && !isPrecision && (
                                        <>
                                            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] pointer-events-none rounded-[24px]" />
                                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-[24px]" />
                                        </>
                                    )}

                                    {!isPrecision && index === 0 && !isCover && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    )}

                                    {isCover ? (
                                        // --- COVER CARD CONTENT ---
                                        <>
                                            {/* Top Label */}
                                            <div className="relative z-10 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                                <span className="text-[11px] font-medium tracking-[0.15em] text-white/70 uppercase">
                                                    {content.label}
                                                </span>
                                            </div>

                                            {/* Main Info */}
                                            <div className="relative z-10 flex flex-col gap-6 mt-8">
                                                <h2 className="text-6xl font-bold text-white tracking-tight leading-none">
                                                    {content.heading}
                                                </h2>
                                                <p className="text-base text-gray-300/75 font-light leading-relaxed max-w-md">
                                                    {content.intro}
                                                </p>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative z-10 w-full h-px bg-white/5 my-auto" />

                                            {/* Footer / Action */}
                                            <div className="relative z-10 w-full flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">system_protocol</span>
                                                    <span className="text-[10px] font-mono text-cyan-400/50 tracking-widest mt-1">ACTIVE_EXECUTION</span>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation() // Prevent card flip
                                                        onInitialize()
                                                    }}
                                                    className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0B0B0B] hover:bg-[#111] border border-white/10 hover:border-white/20 transition-[background-color,border-color,box-shadow] duration-300 shadow-lg"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                                    <span className="text-white/80 font-sans text-[11px] tracking-[0.1em] font-medium group-hover:text-white transition-colors">
                                                        INITIALIZE TREE
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // --- CONTENT CARD CONTENT (REVISED STRUCTURE) ---
                                        subCard && (
                                            <div className="w-full h-full flex flex-col">
                                                {/* Top Label */}
                                                <div className="flex items-center justify-between pointer-events-none">
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                                                        CRITICAL_MODULE 0{content.subCards.findIndex(c => c.id === id) + 1}
                                                    </span>
                                                    <div className="w-12 h-px bg-white/10" />
                                                </div>

                                                {/* Scrollable Detail Area for Expanded Content */}
                                                <div className="flex-1 mt-6 overflow-hidden">
                                                    {/* Card Title */}
                                                    <h3 className="text-3xl font-bold text-white tracking-tight">
                                                        {subCard.title}
                                                    </h3>

                                                    {/* Front Text (Always Visible) */}
                                                    <p className="text-base text-cyan-200/60 leading-relaxed mt-4 font-medium">
                                                        {subCard.frontText}
                                                    </p>

                                                    {id === 'workflow' ? (
                                                        /* STRUCTURED TEXT ARCHITECTURE LAYOUT */
                                                        <div className="flex-1 mt-6 flex flex-col gap-4 overflow-hidden">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                                                <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">
                                                                    TensorThrottle X System Core
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3">
                                                                {[
                                                                    {
                                                                        title: "Intent Protocol",
                                                                        points: ["Defines user intention parsing", "Routes cognitive workflows", "Aligns system objectives"]
                                                                    },
                                                                    {
                                                                        title: "Design in Motion",
                                                                        points: ["Dynamic UI generation", "Component orchestration", "State-driven rendering"]
                                                                    },
                                                                    {
                                                                        title: "Half-Built Systems",
                                                                        points: ["Experimental modules", "Adaptive feature testing", "Iterative refinement layer"]
                                                                    }
                                                                ].map((section, idx) => (
                                                                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400/70 mb-2">
                                                                            {section.title}
                                                                        </h4>
                                                                        <div className="flex flex-col gap-1">
                                                                            {section.points.map((p, pIdx) => (
                                                                                <div key={pIdx} className="flex items-start gap-2">
                                                                                    <span className="text-cyan-500/50 mt-0.5">•</span>
                                                                                    <span className="text-[10px] text-gray-300 leading-tight">{p}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-8 mt-10">
                                                            {/* Left: Definition Context */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{subCard.contextLabel}</h4>
                                                                <p className="text-sm text-gray-400 leading-relaxed">{subCard.contextText}</p>
                                                            </div>

                                                            {/* Right: Items /details */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{subCard.detailsLabel}</h4>
                                                                <ul className="space-y-2">
                                                                    {subCard.details.map((detail, idx) => (
                                                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-300/80">
                                                                            <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                                                                            {detail}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Area */}
                                                <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{subCard.footerLabel}</span>
                                                        <span className="text-xs text-gray-400 italic">"{subCard.footerText}"</span>
                                                    </div>

                                                    {id === 'workflow' ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onInitialize()
                                                            }}
                                                            className="group flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#0B0B0B] hover:bg-[#111] border border-white/10 hover:border-white/20 transition-[background-color,border-color] duration-300"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-cyan-500/80" />
                                                            <span className="text-white/60 font-sans text-[9px] tracking-[0.1em] font-medium group-hover:text-white transition-colors">
                                                                EXPLORE FULLSCREEN
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-cyan-500/40 font-mono text-[9px] tracking-widest uppercase">
                                                            SECURE_EXPANDED_DATA
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Background Hint: Moved to relative flow with even lower top margin to move it higher */}
            <div className="mt-4 w-full flex justify-center opacity-30 pointer-events-none">
                <span className={cn(
                    "text-[10px] font-mono tracking-[0.3em] uppercase animate-pulse",
                    isBright ? "text-black" : "text-white"
                )}>
                    SHUFFLE_STACK_TO_REVEAL
                </span>
            </div>
        </div>
    )
}
