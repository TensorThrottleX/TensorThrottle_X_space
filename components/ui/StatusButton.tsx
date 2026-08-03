'use client'

import React from 'react'
import { differenceInWeeks, isValid } from 'date-fns'
import { formatIST } from '@/lib/utils'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

interface StatusButtonProps {
    latestPublishedAt?: string
    compact?: boolean
    showTimestamp?: boolean
    align?: 'start' | 'end'
}

export function StatusButton({
    latestPublishedAt,
    compact = false,
    showTimestamp = true,
    align = 'start'
}: StatusButtonProps) {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'
    const pubDate = latestPublishedAt ? new Date(latestPublishedAt) : null
    const isValidDate = pubDate && isValid(pubDate)
    const weeksDiff = isValidDate ? differenceInWeeks(new Date(), pubDate!) : Infinity
    const isActive = weeksDiff < 3 // 21 days window

    const statusText = isActive ? 'Active' : 'Inactive'
    const dotColor = isActive ? 'bg-emerald-500' : 'bg-red-500'

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <span className={cn(
                    "rounded-full",
                    "h-[6px] w-[6px] md:h-[7px] md:w-[7px] lg:h-2 lg:w-2",
                    dotColor,
                    isActive && "animate-pulse"
                )} />
                <span className={cn(
                    "text-xs md:text-[13px] lg:text-sm font-medium uppercase tracking-wider",
                    isBright ? "text-black/60" : "text-white/60"
                )}>
                    {statusText}
                </span>
            </div>
        )
    }

    return (
        <div className={`flex flex-col ${align === 'end' ? 'items-end' : 'items-start'} gap-2`}>
            {/* 3D Status Button */}
            <div className={cn(
                    "inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl transition-all duration-300 group/status",
                    isBright
                        ? "bg-white/80 border border-black/10 hover:border-black/20 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                        : "bg-black/50 border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                )}>
                <div className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor} shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-transform duration-300 group-hover/status:scale-110`}></span>
                </div>
                <span className={cn(
                        "text-[11px] font-bold uppercase tracking-tight transition-opacity duration-300 group-hover/status:opacity-100 leading-none",
                        isBright ? "text-black/80" : "text-white"
                )}>
                    {statusText}
                </span>
            </div>

            {/* Last Updated Metadata */}
            {showTimestamp && (
                <div className={`flex flex-col gap-0.5 ${align === 'end' ? 'items-end' : 'items-start ml-1'}`}>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--muted-foreground)' }}>
                        Last Updated
                    </p>
                    <p className="text-[10px] font-mono tracking-tight opacity-70" style={{ color: 'var(--foreground)' }}>
                        {isValidDate && isActive
                            ? formatIST(new Date())
                            : 'WHILE_AGO'
                        }
                    </p>
                </div>
            )}
        </div>
    )
}
