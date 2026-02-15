'use client'

import { useState, useEffect } from 'react'

export function SystemClock() {
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

    if (!mounted || !time) return null

    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0')
        const m = date.getMinutes().toString().padStart(2, '0')
        const s = date.getSeconds().toString().padStart(2, '0')
        return `${h} : ${m} : ${s}`
    }

    const title = formatTime(time)
    const degrees = time.getSeconds() * 6

    return (
        <div className="fixed top-4 right-4 z-[300] pointer-events-none select-none">
            {/* Clock Module */}
            <div className="flex items-center gap-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl">
                {/* Analog Clock */}
                <div className="relative w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center shadow-inner">
                    <div
                        className="absolute top-1/2 left-1/2 w-0 h-0"
                        style={{ transform: `rotate(${degrees}deg)` }}
                    >
                        <div className="absolute w-[1.5px] h-[9px] bg-white -translate-x-[0.75px] -translate-y-[9px]" />
                    </div>
                </div>

                {/* Digital Clock */}
                <div className="text-white font-sans text-xs font-bold tracking-wider tabular-nums opacity-90">
                    {title}
                </div>
            </div>
        </div>
    )
}
