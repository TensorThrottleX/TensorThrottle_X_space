'use client'

import React, { useState } from 'react'
import { TreeColumn } from './components/TreeColumn'
import './styles/globals.css'

interface TreeItem {
    id: string
    title: string
    children?: TreeItem[]
}

const treeData: TreeItem[] = [
    {
        id: 'origin',
        title: 'Origin',
        children: [
            {
                id: 'journey',
                title: 'Journey',
                children: [
                    { id: 'inception', title: 'Inception' },
                    { id: 'the-pivot', title: 'The Pivot' },
                    { id: 'velocity', title: 'Velocity' }
                ]
            },
            {
                id: 'heritage',
                title: 'Heritage',
                children: [
                    { id: 'analog-roots', title: 'Analog Roots' },
                    { id: 'digital-shift', title: 'Digital Shift' }
                ]
            }
        ]
    },
    {
        id: 'focus',
        title: 'Focus',
        children: [
            {
                id: 'paradigm',
                title: 'Paradigm',
                children: [
                    { id: 'automation', title: 'Automation' },
                    { id: 'sovereignty', title: 'Sovereignty' }
                ]
            },
            {
                id: 'engineering',
                title: 'Engineering',
                children: [
                    { id: 'latency', title: 'Latency' },
                    { id: 'throughput', title: 'Throughput' },
                    { id: 'correctness', title: 'Correctness' }
                ]
            }
        ]
    },
    {
        id: 'build',
        title: 'Build',
        children: [
            {
                id: 'systems',
                title: 'Systems',
                children: [
                    { id: 'kernel', title: 'Kernel' },
                    { id: 'network', title: 'Network' }
                ]
            },
            {
                id: 'interfaces',
                title: 'Interfaces',
                children: [
                    { id: 'minimalist', title: 'Minimalist' },
                    { id: 'functional', title: 'Functional' }
                ]
            }
        ]
    },
    {
        id: 'philosophy',
        title: 'Philosophy',
        children: [
            {
                id: 'motive',
                title: 'Motive',
                children: [
                    { id: 'depth', title: 'Depth Over Noise' },
                    { id: 'intentionality', title: 'Intentionality' }
                ]
            },
            {
                id: 'ethics',
                title: 'Ethics',
                children: [
                    { id: 'openness', title: 'Openness' },
                    { id: 'privacy', title: 'Privacy' }
                ]
            }
        ]
    }
]

export default function App() {
    const [expandedPaths, setExpandedPaths] = useState<string[][]>([])

    const findParentId = (data: TreeItem[], targetId: string): string | null => {
        for (const item of data) {
            if (item.children) {
                if (item.children.some(c => c.id === targetId)) return item.id
                const found = findParentId(item.children, targetId)
                if (found) return found
            }
        }
        return null
    }

    const toggleNode = (level: number, id: string, hasChildren: boolean) => {
        if (!hasChildren) return

        setExpandedPaths(prev => {
            const existingPathIndex = prev.findIndex(p => p[level] === id)

            if (existingPathIndex !== -1) {
                const newPaths = [...prev]
                if (newPaths[existingPathIndex].length === level + 1) {
                    newPaths.splice(existingPathIndex, 1)
                } else {
                    newPaths[existingPathIndex] = newPaths[existingPathIndex].slice(0, level + 1)
                }
                return newPaths
            } else {
                const newPath: string[] = []
                if (level === 0) {
                    newPath.push(id)
                } else {
                    const base = prev.find(p => p[level - 1] === findParentId(treeData, id))
                    if (base) {
                        newPath.push(...base.slice(0, level), id)
                    } else {
                        newPath.push(id)
                    }
                }
                return [...prev, newPath]
            }
        })
    }

    const getColumns = () => {
        const columns: TreeItem[][] = [treeData]
        const maxLevel = expandedPaths.reduce((max, p) => Math.max(max, p.length), 0)

        for (let l = 0; l < maxLevel; l++) {
            const activeIdsAtThisLevel = new Set(expandedPaths.filter(p => p.length > l).map(p => p[l]))
            const childrenForNextLevel: TreeItem[] = []

            const currentLevelData = columns[l]
            for (const item of currentLevelData) {
                if (activeIdsAtThisLevel.has(item.id) && item.children) {
                    childrenForNextLevel.push(...item.children)
                }
            }

            if (childrenForNextLevel.length > 0) {
                columns.push(childrenForNextLevel)
            }
        }
        return columns
    }

    const columns = getColumns()

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            {/* Task 2: Hero Title */}
            <h1 className="hero-title fade-in text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.1] uppercase">
                TENSOR<br />THROTTLE X
            </h1>

            {/* Task 1: Tree Section */}
            <div className="fixed top-[280px] left-[60px] right-[60px] bottom-[60px] z-10 pointer-events-none select-none font-mono">
                <div className="flex h-full pointer-events-auto overflow-x-auto scrollbar-hide">
                    {columns.map((columnItems, columnIndex) => (
                        <TreeColumn
                            key={columnIndex}
                            items={columnItems}
                            columnIndex={columnIndex}
                            expandedPaths={expandedPaths}
                            toggleNode={toggleNode}
                        />
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    )
}
