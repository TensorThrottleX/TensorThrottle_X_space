'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SubCardContent {
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

export interface CardContent {
    label: string
    heading: string
    intro: string
    subCards: SubCardContent[]
    treeData: any
}

interface StackedDeckProps {
    mode: 'purpose' | 'about'
    content: CardContent
    isBright: boolean
    onInitialize: () => void
}

export function StackedDeck({
    mode,
    content,
    isBright,
    onInitialize
}: StackedDeckProps) {
    const [stack, setStack] = useState<string[]>([])

    useEffect(() => {
        const initialStack = ['cover', ...content.subCards.map(c => c.id)]
        setStack(initialStack)
    }, [mode, content])

    if (stack.length === 0) return null

    const handleCardClick = (clickedId: string, index: number) => {
        if (index === 0) {
            const newStack = [...stack.slice(1), stack[0]]
            setStack(newStack)
        } else {
            const newStack = [clickedId, ...stack.filter(id => id !== clickedId)]
            setStack(newStack)
        }
    }

    return (
        <div className="primary-card relative perspective-1000 group items-center bg-transparent border-none shadow-none p-0 min-h-[33.75rem]">
            <div className="relative w-full h-full">
                <AnimatePresence>
                    {stack.map((id, index) => {
                        const isCover = id === 'cover'
                        const subCard = content.subCards.find(c => c.id === id)

                        if (!isCover && !subCard) return null

                        return (
                            <motion.div
                                key={id}
                                layoutId={`${mode}-${id}`}
                                onClick={() => handleCardClick(id, index)}
                                initial={false}
                                animate={{
                                    y: `calc(${index} * var(--stack-offset-y))`,
                                    scale: 1 - index * 0.04,
                                    zIndex: stack.length - index,
                                    filter: index === 0 ? 'brightness(1.05)' : 'brightness(0.6) blur(0.5px)',
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25
                                }}
                                className={cn(
                                    "absolute top-0 left-0 w-full h-full rounded-[26px] cursor-pointer overflow-hidden transition-all duration-500",
                                    "border-[1.5px] border-b-[4px] border-r-[2px]",
                                    isBright
                                        ? "bg-white border-black/10 border-b-black/20 border-r-black/15 shadow-[var(--shadow-premium)]"
                                        : (isCover ? "bg-[#050505] border-white/20 border-b-white/30 border-r-white/25 shadow-[var(--shadow-premium)]" : "bg-[var(--card-bg)] backdrop-blur-3xl border-white/10 border-b-white/20 border-r-white/15 shadow-[var(--shadow-premium)]")
                                )}
                                style={{
                                    transformOrigin: 'top center'
                                }}
                            >
                                <div className={cn(
                                    "w-full h-full px-[5rem] py-[4rem] flex flex-col justify-between relative",
                                    isCover ? "bg-[var(--card-bg)]" : ""
                                )}>
                                    {!isBright && (
                                        <>
                                            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none rounded-[24px]" />
                                            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-[24px]" />
                                        </>
                                    )}

                                    {isCover ? (
                                        <>
                                            <div className="relative z-10 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse" />
                                                <span className={cn(
                                                    "text-sm font-bold tracking-tight uppercase",
                                                    isBright ? "text-black/60" : "text-white/80"
                                                )}>
                                                    {content.label}
                                                </span>
                                            </div>

                                            <div className="relative z-10 flex flex-col gap-6 mt-8">
                                                <h2
                                                    className={cn(
                                                        "text-[3.45rem] font-black tracking-tighter leading-[1.1] transition-colors duration-300",
                                                        isBright ? "text-black" : "text-white"
                                                    )}
                                                    style={{ wordSpacing: '0.4em' }}
                                                >
                                                    {content.heading}
                                                </h2>
                                                <p className={cn(
                                                    "text-lg font-medium leading-relaxed max-w-md",
                                                    isBright ? "text-gray-600" : "text-gray-300"
                                                )}>
                                                    {content.intro}
                                                </p>
                                            </div>

                                            <div className={cn(
                                                "relative z-10 w-full h-px my-auto",
                                                isBright ? "bg-black/10" : "bg-white/5"
                                            )} />

                                            <div className="relative z-10 w-full flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-xs font-bold font-mono tracking-normal uppercase",
                                                        isBright ? "text-black/30" : "text-white/30"
                                                    )}>system_protocol</span>
                                                    <span className={cn(
                                                        "text-xs font-bold font-mono tracking-normal mt-1",
                                                        isBright ? "text-cyan-600" : "text-cyan-400/50"
                                                    )}>ACTIVE_EXECUTION</span>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onInitialize()
                                                    }}
                                                    className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0B0B0B] hover:bg-[#111] border border-white/10 hover:border-white/20 transition-[background-color,border-color,box-shadow] duration-300 shadow-lg"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                                    <span className="text-white/80 text-xs tracking-normal font-bold group-hover:text-white transition-colors">
                                                        INITIALIZE TREE
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        subCard && (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="flex items-center justify-between pointer-events-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
                                                        <span className={cn(
                                                            "text-[10px] font-bold tracking-normal uppercase",
                                                            isBright ? "text-black/60" : "text-white/60"
                                                        )}>
                                                            CRITICAL_MODULE 0{content.subCards.findIndex(c => c.id === id) + 1}
                                                        </span>
                                                    </div>
                                                    <div className={cn("w-12 h-px", isBright ? "bg-black/10" : "bg-white/10")} />
                                                </div>

                                                <div className="flex-1 mt-6 overflow-hidden">
                                                    <h3 className={cn(
                                                        "text-[1.95rem] font-black tracking-tighter",
                                                        isBright ? "text-black" : "text-white"
                                                    )}>
                                                        {subCard.title}
                                                    </h3>
                                                    <p className={cn(
                                                        "text-base leading-relaxed mt-4 font-medium",
                                                        isBright ? "text-cyan-800" : "text-cyan-200/60"
                                                    )}>
                                                        {subCard.frontText}
                                                    </p>

                                                    {id === 'workflow' ? (
                                                        <div className="flex-1 mt-6 flex flex-col gap-4 overflow-hidden">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                                                <span className={cn(
                                                                    "text-[11px] font-bold tracking-normal uppercase",
                                                                    isBright ? "text-black/80" : "text-white/90"
                                                                )}>
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
                                                                    <div key={idx} className={cn(
                                                                        "p-3 rounded-lg border backdrop-blur-sm",
                                                                        isBright ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                                                                    )}>
                                                                        <h4 className={cn(
                                                                            "text-[10px] font-bold uppercase tracking-normal mb-2",
                                                                            isBright ? "text-cyan-900" : "text-cyan-400/70"
                                                                        )}>{section.title}</h4>
                                                                        <div className="flex flex-col gap-1">
                                                                            {section.points.map((p, pIdx) => (
                                                                                <div key={pIdx} className="flex items-start gap-2">
                                                                                    <span className={cn("mt-0.5", isBright ? "text-cyan-800" : "text-cyan-500/50")}>•</span>
                                                                                    <span className={cn(
                                                                                        "text-[10px] leading-tight",
                                                                                        isBright ? "text-gray-900" : "text-gray-300"
                                                                                    )}>{p}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-8 mt-10">
                                                            <div className="space-y-3">
                                                                <h4 className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-normal",
                                                                    isBright ? "text-black/60" : "text-white/50"
                                                                )}>{subCard.contextLabel}</h4>
                                                                <p className={cn(
                                                                    "text-sm leading-relaxed",
                                                                    isBright ? "text-gray-700" : "text-gray-400"
                                                                )}>{subCard.contextText}</p>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <h4 className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-normal",
                                                                    isBright ? "text-black/60" : "text-white/50"
                                                                )}>{subCard.detailsLabel}</h4>
                                                                <ul className="space-y-2">
                                                                    {subCard.details.map((detail, idx) => (
                                                                        <li key={idx} className={cn(
                                                                            "flex items-center gap-2 text-xs",
                                                                            isBright ? "text-gray-800" : "text-gray-300/80"
                                                                        )}>
                                                                            <div className={cn("w-1 h-1 rounded-full", isBright ? "bg-cyan-600" : "bg-cyan-500/50")} />
                                                                            {detail}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-normal",
                                                            isBright ? "text-black/40" : "text-white/30"
                                                        )}>{subCard.footerLabel}</span>
                                                        <span className={cn(
                                                            "text-xs italic",
                                                            isBright ? "text-gray-600 font-medium" : "text-gray-400"
                                                        )}>"{subCard.footerText}"</span>
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
                                                            <span className="text-white/60 text-[9px] tracking-normal font-medium group-hover:text-white transition-colors">EXPLORE FULLSCREEN</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-cyan-500/40 font-mono text-[9px] tracking-normal uppercase">SECURE_EXPANDED_DATA</span>
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
            <div className="mt-2 w-full flex justify-center pointer-events-none">
                <span className={cn(
                    "text-xs font-black font-mono tracking-tighter uppercase animate-pulse",
                    isBright ? "text-black opacity-70" : "text-white/40"
                )}>SHUFFLE_STACK_TO_REVEAL</span>
            </div>
        </div>
    )
}
