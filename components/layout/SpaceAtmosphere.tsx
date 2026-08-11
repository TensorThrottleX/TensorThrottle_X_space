'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useUI } from '@/components/providers/UIProvider'

interface SpaceAtmosphereProps {
    spaceProgress: number
    hideNebula?: boolean
}

interface Star {
    id: number
    x: number
    y: number
    size: number
    delay: number
    duration: number
    opacity: number
}

interface ShootingStar {
    id: number
    top: number
    left: number
    angle: number
    delay: number
    duration: number
    length: number
}

const STAR_COUNT = 300
const SHOOTING_STAR_INTERVAL = 4000

function generateStars(): Star[] {
    const stars: Star[] = []
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 0.5 + Math.random() * 2,
            delay: Math.random() * 5,
            duration: 2 + Math.random() * 4,
            opacity: 0.3 + Math.random() * 0.7,
        })
    }
    return stars
}

function generateShootingStar(): ShootingStar {
    return {
        id: Date.now() + Math.random(),
        top: Math.random() * 40,
        left: Math.random() * 70 + 10,
        angle: -25 + Math.random() * 15,
        delay: 0,
        duration: 1.2 + Math.random() * 0.8,
        length: 80 + Math.random() * 120,
    }
}



function ShootingStarLine({ star, isBright }: { star: ShootingStar; isBright: boolean }) {
    const angleRad = (star.angle * Math.PI) / 180
    const dx = Math.cos(angleRad) * star.length
    const dy = Math.sin(angleRad) * star.length
    return (
        <div
            className="absolute"
            style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: 0,
                height: 0,
                opacity: 0,
                animation: `shooting-star ${star.duration}s ease-out ${star.delay}s forwards`,
                willChange: 'transform, opacity',
            }}
        >
            <div
                className="absolute"
                style={{
                    width: star.length,
                    height: 1,
                    background: isBright
                        ? 'linear-gradient(to left, transparent, rgba(0,0,0,0.6))'
                        : 'linear-gradient(to left, transparent, rgba(255,255,255,0.8))',
                    transform: `rotate(${star.angle}deg)`,
                    transformOrigin: 'right center',
                    borderRadius: 1,
                }}
            />
        </div>
    )
}

    export function SpaceAtmosphere({ spaceProgress, hideNebula = false }: SpaceAtmosphereProps) {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'
    const stars = useMemo(() => generateStars(), [])
    const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const visible = spaceProgress > 0
    const opacity = Math.min(spaceProgress * 1.5, 1)

    const addShootingStar = useCallback(() => {
        setShootingStars(prev => {
            const next = [...prev, generateShootingStar()]
            if (next.length > 5) next.shift()
            return next
        })
    }, [])

    useEffect(() => {
        if (visible && !intervalRef.current) {
            addShootingStar()
            intervalRef.current = setInterval(addShootingStar, SHOOTING_STAR_INTERVAL)
        }
        if (!visible && intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
            setShootingStars([])
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [visible, addShootingStar])

    return (
        <>
            <style>{`
                @keyframes star-twinkle {
                    0%, 100% { opacity: 0; }
                    50% { opacity: var(--star-opacity, 0.8); }
                }
                @keyframes shooting-star {
                    0% { transform: translateX(0) translateY(0); opacity: 1; }
                    70% { opacity: 1; }
                    100% { transform: translateX(-300px) translateY(300px); opacity: 0; }
                }
            `}</style>
            <div
                className={`fixed inset-0 pointer-events-none overflow-hidden ${hideNebula ? 'z-0 bg-[#00040a]' : 'z-[4]'}`}
                style={{
                    opacity,
                    transition: 'opacity 0.8s ease-out',
                    willChange: 'opacity',
                }}
            >
                {/* Space dust / nebula gradient */}
                {!hideNebula && (
                    <div
                        className="absolute inset-0"
                        style={{
                            opacity: Math.min(spaceProgress * 0.6, 0.3),
                            transition: 'opacity 0.8s ease-out',
                            background: `
                                radial-gradient(ellipse at 20% 30%, rgba(100,60,180,0.06) 0%, transparent 50%),
                                radial-gradient(ellipse at 80% 70%, rgba(30,80,160,0.05) 0%, transparent 50%),
                                radial-gradient(ellipse at 50% 50%, rgba(60,30,120,0.03) 0%, transparent 60%)
                            `,
                        }}
                    />
                )}

                {/* Stars */}
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: star.size,
                            height: star.size,
                            opacity: 0,
                            background: isBright ? 'rgba(0,0,0,0.5)' : '#ffffff',
                            boxShadow: star.size > 1.5
                                ? isBright
                                    ? `0 0 ${star.size * 3}px rgba(0,0,0,0.2)`
                                    : `0 0 ${star.size * 3}px rgba(255,255,255,0.4)`
                                : 'none',
                            animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                            '--star-opacity': star.opacity,
                            willChange: 'opacity',
                        } as React.CSSProperties}
                    />
                ))}

                {/* Shooting stars */}
                {shootingStars.map(s => (
                    <ShootingStarLine key={s.id} star={s} isBright={isBright} />
                ))}
            </div>
        </>
    )
}
