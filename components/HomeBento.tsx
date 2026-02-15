'use client'

import React from 'react'
import Link from 'next/link'
import { Brain, FlaskConical, Folder, Layers, ArrowRight, Zap } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'

export function HomeBento() {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'

    // Helper for card base styles
    const cardBase = `group relative overflow-hidden rounded-3xl backdrop-blur-md transition-all duration-500 border`
    const cardStyle = {
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: isBright ? 'var(--shadow-soft)' : 'none',
        color: 'var(--foreground)'
    }

    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="grid h-full max-h-[800px] w-full max-w-5xl grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">

                {/* 1. Hero / Identity Card (Span 2x1) */}
                <div
                    className={`${cardBase} col-span-1 md:col-span-2 row-span-1 hover:shadow-2xl hover:-translate-y-1`}
                    style={cardStyle}
                >
                    {/* Animated Background Pattern - Only visible in dark modes or adjusted for bright */}
                    <div className={`absolute inset-0 transition-opacity duration-700 ${isBright ? 'opacity-0' : 'opacity-50 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)]'}`} />
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, ${isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)'} 1px, transparent 0)`,
                            backgroundSize: '24px 24px'
                        }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between p-8">
                        <div>
                            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm mb-4 transition-colors
                                ${isBright ? 'border-cyan-600/20 bg-cyan-100 text-cyan-800' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'}
                            `}>
                                <span className="mr-1.5 flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                System Operational
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: 'var(--heading-primary)' }}>
                                TensorThrottle<span className="text-cyan-500">_X</span>
                            </h1>
                            <p className="mt-4 max-w-sm text-sm md:text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                                A digital research facility exploring the boundaries of interface design, code, and machine intelligence.
                            </p>
                        </div>

                        <Link href="/feed" className="group/btn inline-flex items-center gap-2 text-xs font-black uppercase tracking-tighter transition-colors hover:text-cyan-500" style={{ color: 'var(--foreground)' }}>
                            Enter Feed <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* 2. Projects (Veritcal Card) */}
                <Link
                    href="/category/projects"
                    className={`${cardBase} col-span-1 row-span-2 hover:shadow-2xl hover:-translate-y-1`}
                    style={{ ...cardStyle, backgroundImage: isBright ? 'none' : 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.4), rgba(0, 0, 0, 0.4))' }}
                >
                    {/* Gradient overlay for bright mode? No, clean white. */}
                    <div className={`absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.1)_50%,transparent_75%)] bg-[length:250%_250%] transition-opacity duration-700 animate-gradient-xy ${isBright ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />

                    {/* Visual: Abstract Geometric Structure */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isBright ? 'opacity-10' : 'opacity-30 group-hover:opacity-50'}`}>
                        <div className={`h-64 w-64 rounded-full border rotate-45 group-hover:rotate-90 transition-transform duration-2000 ease-in-out ${isBright ? 'border-purple-600/20' : 'border-purple-500/30'}`} />
                        <div className={`absolute h-48 w-48 rounded-full border -rotate-12 group-hover:rotate-0 transition-transform duration-2000 ${isBright ? 'border-purple-600/20' : 'border-purple-500/30'}`} />
                        <Folder className={`absolute h-16 w-16 ${isBright ? 'text-purple-600/30' : 'text-purple-400/50'}`} />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-end p-8">
                        <h3 className="text-2xl font-black tracking-tighter mb-2" style={{ color: 'var(--foreground)' }}>Projects</h3>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tangible outputs. The build logs.</p>
                    </div>
                </Link>

                {/* 3. Thoughts (Square) */}
                <Link
                    href="/category/thoughts"
                    className={`${cardBase} col-span-1 hover:shadow-2xl hover:-translate-y-1`}
                    style={{ ...cardStyle, backgroundImage: isBright ? 'none' : 'linear-gradient(to bottom right, rgba(6, 78, 59, 0.4), rgba(0, 0, 0, 0.4))' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className={`h-24 w-24 transition-all duration-500 group-hover:scale-110 ${isBright ? 'text-emerald-600/10 group-hover:text-emerald-600/20' : 'text-emerald-500/20 group-hover:text-emerald-400/40'}`} />
                    </div>
                    <div className="relative z-10 flex h-full flex-col justify-end p-6">
                        <h3 className="text-xl font-black tracking-tighter" style={{ color: 'var(--foreground)' }}>Thoughts</h3>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Philosophy & Theory.</p>
                    </div>
                </Link>

                {/* 4. Experiments (Square) */}
                <Link
                    href="/category/experiments"
                    className={`${cardBase} col-span-1 hover:shadow-2xl hover:-translate-y-1`}
                    style={{ ...cardStyle, backgroundImage: isBright ? 'none' : 'linear-gradient(to bottom right, rgba(136, 19, 55, 0.4), rgba(0, 0, 0, 0.4))' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FlaskConical className={`h-24 w-24 transition-all duration-500 group-hover:rotate-12 ${isBright ? 'text-rose-600/10 group-hover:text-rose-600/20' : 'text-rose-500/20 group-hover:text-rose-400/40'}`} />
                    </div>
                    <div className="relative z-10 flex h-full flex-col justify-end p-6">
                        <h3 className="text-xl font-black tracking-tighter" style={{ color: 'var(--foreground)' }}>Experiments</h3>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Volatile & Unsafe.</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
