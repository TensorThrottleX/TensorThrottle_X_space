"use client"

import React, { useState, useEffect } from 'react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

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

    const title = formatTime(time)
    const degrees = time.getSeconds() * 6

    return (
        <div className="fixed top-8 right-10 z-[300] pointer-events-none select-none">
            {/* Clock Module */}
            <div className={cn(
                "flex items-center gap-4 backdrop-blur-md px-4 py-2 rounded-lg border shadow-[var(--shadow-premium)]",
                isBright ? "bg-white/80 border-black/10" : "bg-black/80 border-white/10"
            )}>
                {/* Analog Clock */}
                <div className={cn(
                    "relative w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center shadow-inner",
                    isBright ? "border-black" : "border-white"
                )}>
                    <div
                        className="absolute top-1/2 left-1/2 w-0 h-0"
                        style={{ transform: `rotate(${degrees}deg)` }}
                    >
                        <div className={cn(
                            "absolute w-[1.5px] h-[9px] -translate-x-[0.75px] -translate-y-[9px]",
                            isBright ? "bg-black" : "bg-white"
                        )} />
                    </div>
                </div>

                {/* Digital Clock */}
                <div className={cn(
                    "font-sans text-xs font-bold tracking-wider tabular-nums opacity-90",
                    isBright ? "text-black" : "text-white"
                )}>
                    {title}
                </div>
            </div>
        </div>
    )
}
