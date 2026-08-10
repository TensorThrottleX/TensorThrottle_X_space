'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

export function LiveTrafficStats() {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'

    // Mock data for the indicators
    const [activeUsers, setActiveUsers] = useState(42)
    const [totalVisits, setTotalVisits] = useState(14829)

    // Simulate slight fluctuations in active users
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveUsers(prev => {
                const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
                return Math.max(1, prev + change)
            })
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div 
            className="flex items-center gap-6 px-5 py-2 rounded-full border transition-colors duration-300 pointer-events-auto"
            style={{
                backgroundColor: 'var(--adaptive-glass-bg)',
                borderColor: 'var(--adaptive-glass-border)',
                boxShadow: 'var(--adaptive-glass-shadow)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
            }}
        >
            {/* Active Users */}
            <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-purple-500/70 animate-ping" style={{ animationDuration: '3s' }} />
                    <span className="absolute inset-0 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </div>
                <span className={cn(
                    "font-mono text-xs font-bold tracking-widest",
                    isBright ? "text-black/80" : "text-white/80"
                )}>
                    {activeUsers} <span className="opacity-40 text-[9px] uppercase ml-1">Active</span>
                </span>
            </div>

            {/* Total Visits */}
            <div className="flex items-center gap-2.5">
                <Eye 
                    size={13} 
                    className={cn(
                        "transition-colors duration-300", 
                        isBright ? "text-gray-400" : "text-gray-500"
                    )} 
                />
                <span className={cn(
                    "font-mono text-xs font-bold tracking-widest",
                    isBright ? "text-black/80" : "text-white/80"
                )}>
                    {totalVisits.toLocaleString()} <span className="opacity-40 text-[9px] uppercase ml-1">Total</span>
                </span>
            </div>
        </div>
    )
}
