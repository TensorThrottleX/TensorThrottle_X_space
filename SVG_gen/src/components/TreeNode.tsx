'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface TreeNodeProps {
    id: string
    title: string
    isActive: boolean
    isExpanded: boolean
    hasChildren: boolean
    onClick: () => void
    columnIndex: number
    itemIndex: number
}

export function TreeNode({
    id,
    title,
    isActive,
    isExpanded,
    hasChildren,
    onClick,
    columnIndex,
    itemIndex
}: TreeNodeProps) {
    const opacity = Math.max(0.4, 1 - columnIndex * 0.15)

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{
                duration: 0.22,
                delay: itemIndex * 0.03,
                ease: [0.16, 1, 0.3, 1]
            }}
            onClick={onClick}
            className={`
                group relative flex items-center justify-between
                px-4 py-3 rounded-md cursor-point transition-all duration-200
                ${isActive ? 'bg-white/5 border-l-2 border-white' : 'border-l-2 border-transparent hover:bg-white/5 hover:border-white/50'}
            `}
            style={{ opacity }}
        >
            <div className="flex flex-col">
                <span className={`text-sm tracking-widest uppercase transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {title}
                </span>
            </div>
            {hasChildren && (
                <span className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-90 text-white' : 'text-white/30'}`}>
                    {isExpanded ? '▼' : '▶'}
                </span>
            )}

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.05)] opacity-0 group-hover:opacity-100 transition-opacity rounded-md pointer-events-none" />
        </motion.div>
    )
}
