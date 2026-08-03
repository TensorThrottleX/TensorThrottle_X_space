"use client"

import React, { useState, useEffect } from 'react'
import { useUI } from '@/components/providers/UIProvider'

function AnalogClock({ time, accent }: { time: Date; accent: string }) {
    const hours = time.getHours() % 12
    const minutes = time.getMinutes()
    const seconds = time.getSeconds()

    const hourDeg = hours * 30 + minutes * 0.5
    const minuteDeg = minutes * 6 + seconds * 0.1
    const secondDeg = seconds * 6

    const toRad = (deg: number) => (deg - 90) * (Math.PI / 180)

    return (
        <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
            {/* Tick marks — 12 hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = toRad(i * 30)
                return (
                    <line
                        key={i}
                        x1={10 + 7.5 * Math.cos(angle)}
                        y1={10 + 7.5 * Math.sin(angle)}
                        x2={10 + 9 * Math.cos(angle)}
                        y2={10 + 9 * Math.sin(angle)}
                        stroke="currentColor"
                        strokeWidth={i % 3 === 0 ? 0.6 : 0.35}
                        strokeLinecap="round"
                        opacity={i % 3 === 0 ? 0.8 : 0.4}
                    />
                )
            })}
            {/* Hour hand */}
            <line
                x1="10" y1="10"
                x2={10 + 4.5 * Math.cos(toRad(hourDeg))}
                y2={10 + 4.5 * Math.sin(toRad(hourDeg))}
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
            />
            {/* Minute hand */}
            <line
                x1="10" y1="10"
                x2={10 + 6 * Math.cos(toRad(minuteDeg))}
                y2={10 + 6 * Math.sin(toRad(minuteDeg))}
                stroke="currentColor"
                strokeWidth="0.75"
                strokeLinecap="round"
                opacity={0.85}
            />
            {/* Second hand */}
            <line
                x1="10" y1="10"
                x2={10 + 7 * Math.cos(toRad(secondDeg))}
                y2={10 + 7 * Math.sin(toRad(secondDeg))}
                stroke={accent}
                strokeWidth="0.45"
                strokeLinecap="round"
            />
            {/* Center cap */}
            <circle cx="10" cy="10" r="0.7" fill={accent} />
        </svg>
    )
}

export function SystemClock() {
    const { renderMode, isBooting } = useUI()
    const isBright = renderMode === 'bright'
    const [mounted, setMounted] = useState(false)
    const [time, setTime] = useState<Date | null>(null)

    useEffect(() => {
        setMounted(true)
        setTime(new Date())
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    if (!mounted || !time || isBooting) return null

    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0')
        const m = date.getMinutes().toString().padStart(2, '0')
        const s = date.getSeconds().toString().padStart(2, '0')
        return `${h} : ${m} : ${s}`
    }

    const accent = isBright ? '#0891b2' : '#22d3ee'

    return (
        <div className="pointer-events-none select-none">
            <div
                className="flex items-center gap-2.5 backdrop-blur-xl px-4 py-2.5 border transition-all duration-500 rounded-2xl"
                style={{
                    backgroundColor: 'var(--adaptive-glass-bg)',
                    borderColor: 'var(--adaptive-glass-border)',
                    boxShadow: 'var(--adaptive-glass-shadow)',
                }}
            >
                <AnalogClock time={time} accent={accent} />
                <span
                    className="font-sans text-[11px] font-bold tracking-wider tabular-nums"
                    style={{ color: 'var(--adaptive-hero-color)' }}
                >
                    {formatTime(time)}
                </span>
            </div>
        </div>
    )
}
