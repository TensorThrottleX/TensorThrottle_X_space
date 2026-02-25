'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Lazy-load InteractiveTree — only loaded when user enters tree mode
// This defers loading ~30KB of D3 code until actually needed
// Lazy-load InteractiveTree — only loaded when user enters tree mode
const InteractiveTree = dynamic(
    () => import('@/components/visuals/InteractiveTree')
        .then(m => ({ default: m.InteractiveTree }))
        .catch(err => {
            console.error("InteractiveTree load failed:", err);
            return { default: () => <div className="fixed inset-0 z-[200] bg-red-900/20 flex items-center justify-center text-white font-mono">CRITICAL_LOAD_FAILURE: TREE_MODULE</div> };
        }),
    {
        ssr: false,
        loading: () => <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center text-cyan-400 font-mono animate-pulse">LOADING_COGNITIVE_TREE...</div>
    }
)
import type { TreeNode } from '@/components/visuals/InteractiveTree'

// --- Types ---

import { StackedDeck, CardContent } from './StackedDeck'
import { SystemQuoteRenderer } from './SystemQuoteRenderer'

// --- Data ---
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
    const isBright = renderMode === 'bright'

    /* HOME > COGNITIVE_DASHBOARD > STATE > TREE_RESET */
    const prevModeRef = useRef(mode)
    useEffect(() => {
        if (prevModeRef.current !== mode) {
            console.log("CognitiveDashboard Mode Actually Changed:", mode);
            if (uiMode === 'tree') setUiMode('default')
            prevModeRef.current = mode
        }
    }, [mode, uiMode, setUiMode])

    const isQuote = mode === 'quote'
    const currentContent = isQuote ? null : contentMap[mode as 'purpose' | 'about']
    console.log("CognitiveDashboard Render. uiMode:", uiMode, "mode:", mode);

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
                    /* QUOTE LAYOUT */
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
                    /* MAIN LAYOUT */
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
                                mode={mode}
                                content={currentContent}
                                isBright={isBright}
                                onInitialize={() => setUiMode('tree')}
                            />
                        </div>
                    </motion.div>
                ) : currentContent ? (
                    /* TREE LAYOUT */
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
