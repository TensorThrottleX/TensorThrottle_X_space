'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import dynamic from 'next/dynamic'

interface GlobeSectionProps {
    isBright: boolean
    revealProgress?: number
}

export function GlobeSection({ isBright, revealProgress = 1 }: GlobeSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(sectionRef, { amount: 0.5, once: false })
    const [hasEverEntered, setHasEverEntered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [showReticle, setShowReticle] = useState(false)

    const effectiveOpacity = Math.min(revealProgress * 1.2, 1)

    // Lazy-mount Globe instance once, keep mounted
    useEffect(() => {
        if (isInView && !hasEverEntered) {
            setHasEverEntered(true)
        }
    }, [isInView, hasEverEntered])

    const handleGlobeMouseMove = useCallback((e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY })
    }, [])

    return (
        <div
            ref={sectionRef}
            className="relative w-full min-h-screen flex flex-col items-center justify-center"
            style={{ backgroundColor: 'var(--globe-section-bg)' }}
        >
            {/* Light mode subtle cream atmosphere */}
            {isBright && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center 40%, rgba(239,236,231,0.5) 0%, transparent 70%)',
                    }}
                />
            )}

            {/* Section label */}
            <motion.div
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center text-center mb-8 pointer-events-none"
            >
                <span
                    className="text-[10px] font-bold uppercase tracking-[0.35em] mb-4"
                    style={{ color: isBright ? 'rgba(85,81,75,0.5)' : 'rgba(255,255,255,0.3)' }}
                >
                    Intelligence Layer
                </span>
                <h2 style={{ color: 'var(--heading-primary)' }}>
                    Neural Evolution Globe
                </h2>
                <p
                    className="text-sm mt-3 max-w-md leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Interactive visualization of intelligence milestones across evolutionary time.
                    Click nodes to activate neural pathways.
                </p>
            </motion.div>

            {/* Custom cursor reticle */}
            {hasEverEntered && showReticle && (
                <div
                    style={{
                        position: 'fixed',
                        left: mousePos.x - 16,
                        top: mousePos.y - 16,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: isBright
                            ? '1.5px solid rgba(85,81,75,0.3)'
                            : '1.5px solid rgba(255,255,255,0.35)',
                        boxShadow: isBright
                            ? '0 0 12px rgba(34,211,238,0.08), inset 0 0 8px rgba(34,211,238,0.03)'
                            : '0 0 12px rgba(34,211,238,0.15), inset 0 0 8px rgba(34,211,238,0.05)',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        transform: 'translateZ(0)',
                        transition: 'width 0.2s, height 0.2s, border-color 0.2s',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: isBright ? 'rgba(85,81,75,0.5)' : 'rgba(255,255,255,0.5)',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 6px rgba(34,211,238,0.3)',
                        }}
                    />
                </div>
            )}

            {/* Globe container — fully visible sphere, no clipping */}
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: isInView ? effectiveOpacity : 0, y: isInView ? 0 : 60 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-2xl lg:max-w-4xl aspect-square mx-auto"
                onMouseEnter={() => setShowReticle(true)}
                onMouseLeave={() => setShowReticle(false)}
                onMouseMove={handleGlobeMouseMove}
            >
                {/* Radial glow behind globe — fades in with scroll */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: isInView ? effectiveOpacity * 0.6 : 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.108) 0%, transparent 48%)',
                    }}
                />

                <GlobeCanvas
                    dotStrength={1.5}
                    showConnections={hasEverEntered}
                    active={hasEverEntered}
                    starfieldIntensity={Math.max(0, Math.min((revealProgress - 0.35) / 0.5, 1))}
                />
            </motion.div>

            {/* Bottom hint — fades in with entryProgress */}
            <motion.div
                animate={{ opacity: isInView ? 1 : 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 mt-8 pointer-events-none"
            >
                <span
                    className="text-[10px] font-mono uppercase tracking-wider animate-pulse"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Click nodes to explore · Double-click to rotate freely
                </span>
            </motion.div>
        </div>
    )
}

const NeuralGlobe = dynamic(
    () => import('@/components/globe/neural-globe').then((mod) => mod.NeuralGlobe),
    { ssr: false }
)

function GlobeCanvas({ dotStrength = 1, showConnections = false, active = false, starfieldIntensity }: { dotStrength?: number; showConnections?: boolean; active?: boolean; starfieldIntensity?: number }) {
    return (
        <div className="w-full h-full min-h-[300px]">
            {active && (
                <NeuralGlobe
                    width="100%"
                    height="100%"
                    autoRotate
                    enableInteraction
                    showParticles
                    showConnections={showConnections}
                    transparent
                    dotStrength={dotStrength}
                    starfieldIntensity={starfieldIntensity}
                    className="w-full h-full"
                />
            )}
        </div>
    )
}
