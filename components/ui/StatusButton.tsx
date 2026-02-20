'use client'

import React from 'react'
import { differenceInWeeks, isValid } from 'date-fns'
import { formatIST } from '@/lib/utils'

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
    const pubDate = latestPublishedAt ? new Date(latestPublishedAt) : null
    const isValidDate = pubDate && isValid(pubDate)
    const weeksDiff = isValidDate ? differenceInWeeks(new Date(), pubDate!) : Infinity
    const isActive = weeksDiff < 3 // 21 days window

    const statusText = isActive ? 'Active' : 'Inactive'
    const colorClass = isActive ? 'bg-emerald-500' : 'bg-red-500'
    const shadowClass = isActive ? 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'shadow-[0_0_12px_rgba(239,68,68,0.4)]'

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md shadow-2xl">
                <div className="relative flex h-1 w-1">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`}></span>
                    <span className={`relative inline-flex h-1 w-1 rounded-full ${colorClass} ${shadowClass}`}></span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight text-white leading-none">
                    {statusText}
                </span>
            </div>
        )
    }

    return (
        <div className={`flex flex-col ${align === 'end' ? 'items-end' : 'items-start'} gap-2`}>
            {/* 3D Status Button */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 hover:border-white/20 group/status">
                <div className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`}></span>
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${colorClass} ${shadowClass} transition-transform duration-300 group-hover/status:scale-110`}></span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight text-white transition-opacity duration-300 group-hover/status:opacity-100 leading-none">
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
                            ? formatIST(pubDate!)
                            : 'WHILE_AGO'
                        }
                    </p>
                </div>
            )}
        </div>
    )
}
