'use client'

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { TreeNode } from './TreeNode'

interface TreeItem {
    id: string
    title: string
    children?: TreeItem[]
}

interface TreeColumnProps {
    items: TreeItem[]
    columnIndex: number
    expandedPaths: string[][]
    toggleNode: (level: number, id: string, hasChildren: boolean) => void
}

export function TreeColumn({
    items,
    columnIndex,
    expandedPaths,
    toggleNode
}: TreeColumnProps) {
    return (
        <div className="flex flex-col gap-2 min-w-[200px] pr-8 border-r border-white/5 last:border-r-0 h-full overflow-y-auto scrollbar-hide py-4">
            <AnimatePresence mode="popLayout">
                {items.map((item, itemIndex) => {
                    const isExpanded = expandedPaths.some(p => p[columnIndex] === item.id && p.length > columnIndex + 1)
                    const isActive = expandedPaths.some(p => p[columnIndex] === item.id)

                    return (
                        <TreeNode
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            isActive={isActive}
                            isExpanded={isExpanded}
                            hasChildren={!!item.children}
                            onClick={() => toggleNode(columnIndex, item.id, !!item.children)}
                            columnIndex={columnIndex}
                            itemIndex={itemIndex}
                        />
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
