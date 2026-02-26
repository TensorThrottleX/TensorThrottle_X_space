'use client'

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import 'd3-transition' // Side-effect patches Selection.prototype.transition
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUI } from '@/components/providers/UIProvider'
import { TREE_ANIMATION_CONFIG } from '@/lib/tree-animations'

// --- Types ---
export interface TreeNode {
    name: string
    id?: string
    children?: TreeNode[]
    _children?: TreeNode[]
}

type HierarchyPointNode = d3.HierarchyPointNode<TreeNode> & {
    x0?: number
    y0?: number
    _children?: HierarchyPointNode[]
}

interface InteractiveTreeProps {
    data: TreeNode
    onClose: () => void
    standalone?: boolean
}

// --- Utils ---
function createInstantChainable(sel: any) {
    const chainable: any = {
        duration: () => chainable,
        delay: () => chainable,
        ease: () => chainable,
        attr: (...args: any[]) => { sel.attr(...args); return chainable; },
        style: (...args: any[]) => { sel.style(...args); return chainable; },
        remove: () => { sel.remove(); return chainable; },
        on: () => chainable,
        call: (fn: any) => { fn(sel); return chainable; },
    };
    return chainable;
}

function safeTransition(sel: any, duration: number): any {
    try {
        if (typeof sel?.transition === 'function') {
            const trans = sel.transition();
            if (trans && typeof trans.duration === 'function') {
                return trans.duration(duration);
            }
        }
    } catch (e) {
        console.warn('[InteractiveTree] transition() failed:', e);
    }
    return createInstantChainable(sel);
}

function diagonalPath(s: { x: number, y: number }, d: { x: number, y: number }) {
    return `M ${s.y} ${s.x} C ${(s.y + d.y) / 2} ${s.x}, ${(s.y + d.y) / 2} ${d.x}, ${d.y} ${d.x}`
}

/**
 * [OPTIMIZED] InteractiveTree
 * - L1: Lifecycle-aware (Init -> Data -> Style)
 * - L2: Terminal Deep-Linking Response
 * - L3: Integrated Zoom/Pan
 */
export function InteractiveTree({ data, onClose, standalone = false }: InteractiveTreeProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
    const rootRef = useRef<HierarchyPointNode | null>(null)
    const isTransitioning = useRef(false)
    const lockTimer = useRef<NodeJS.Timeout | null>(null)

    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'

    // Theme Tokens
    const nodeFill = isBright ? '#ffffff' : '#0a0a0a'
    const nodeStroke = isBright ? 'rgba(0,0,0,0.35)' : 'rgba(34, 211, 238, 0.3)'
    const textColor = isBright ? '#000000' : '#ffffff'
    const linkColor = isBright ? '#333333' : 'rgba(34, 211, 238, 0.5)'

    const margin = standalone
        ? { top: 40, right: 40, bottom: 40, left: 60 }
        : { top: 60, right: 120, bottom: 60, left: 180 }

    const { DURATION, LOCK_BUFFER } = TREE_ANIMATION_CONFIG
    const nodeWidth = 260
    const nodeHeight = 85

    /**
     * CORE: UPDATE_TREE
     * Handles structural transitions (expand/collapse)
     */
    const updateTree = (source: HierarchyPointNode) => {
        const g = gRef.current
        const root = rootRef.current
        if (!g || !root) return

        const treeLayout = d3.tree<TreeNode>().nodeSize([nodeHeight, nodeWidth])
        treeLayout(root as any)

        const nodes = root.descendants() as HierarchyPointNode[]
        const links = root.links()

        nodes.forEach(d => { d.y = d.depth * nodeWidth })

        // Interaction Guardian
        isTransitioning.current = true
        if (lockTimer.current) clearTimeout(lockTimer.current)
        lockTimer.current = setTimeout(() => isTransitioning.current = false, DURATION.CONTAINER + LOCK_BUFFER)

        // --- LINKS UPDATE ---
        const link = g.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>('path.link')
            .data(links, (d: any) => d.target.data.name + d.target.depth)

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', () => {
                const o = { x: source.x0 || 0, y: source.y0 || 0 }
                return diagonalPath(o, o)
            })
            .style("fill", "none")
            .style("stroke-width", isBright ? "2px" : "1.5px")
            .style("stroke-opacity", 0)

        const linkUpdate = linkEnter.merge(link)
        safeTransition(linkUpdate, DURATION.CONNECTOR)
            .attr('d', (d: any) => diagonalPath(d.source as any, d.target as any))
            .style("stroke", linkColor) // Ensure theme applied
            .style("stroke-opacity", isBright ? 0.7 : 0.6)

        safeTransition(link.exit(), DURATION.COLLAPSE_CONNECTOR)
            .attr('d', () => diagonalPath({ x: source.x, y: source.y }, { x: source.x, y: source.y }))
            .style("stroke-opacity", 0)
            .remove()

        // --- NODES UPDATE ---
        const node = g.selectAll<SVGGElement, HierarchyPointNode>('g.node')
            .data(nodes, (d: HierarchyPointNode) => d.data.name + d.depth)

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", `translate(${source.y0},${source.x0})`)
            .style("opacity", 0)
            .on('click', (e, d) => !isTransitioning.current && handleToggle(d))
            .style("cursor", "pointer")

        // Node Shape
        nodeEnter.append('rect')
            .attr('rx', 18)
            .attr('ry', 18)
            .attr('y', -20)
            .attr('x', -8)
            .attr('height', 40)
            .attr('width', (d) => Math.max(160, d.data.name.length * 9 + 40))
            .style("fill", nodeFill)
            .style("stroke", nodeStroke)
            .style("stroke-width", "1px")

        // Node Text
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", 15)
            .text(d => d.data.name)
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "13px")
            .style("font-weight", 600)
            .style("fill", textColor)
            .style("pointer-events", "none")

        // Indicator (>)
        nodeEnter.append('text')
            .attr('class', 'toggle-hint')
            .attr('dy', '.35em')
            .attr('x', d => Math.max(160, d.data.name.length * 9 + 40) - 20)
            .style("font-size", "14px")
            .style("fill", isBright ? "rgba(0,0,0,0.3)" : "rgba(34,211,238,0.5)")

        const nodeUpdate = nodeEnter.merge(node)

        safeTransition(nodeUpdate, DURATION.CONTAINER)
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
            .style("opacity", 1)

        // Reactively update child hint
        nodeUpdate.select('.toggle-hint')
            .text(d => d._children ? '>' : d.children ? '<' : '')

        safeTransition(node.exit(), DURATION.COLLAPSE_CONTAINER)
            .attr("transform", () => `translate(${source.y},${source.x})`)
            .style("opacity", 0)
            .remove()

        nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; })
    }

    const handleToggle = (d: HierarchyPointNode) => {
        if (d.children) {
            d._children = d.children as HierarchyPointNode[]
            d.children = undefined
        } else if (d._children) {
            d.children = d._children
            d._children = undefined
        }
        updateTree(d)
    }

    // --- EFFECT 1: INITIALIZATION & EVENTS ---
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return

        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight

        const baseSvg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", "100%")

        baseSvg.selectAll("*").remove()

        // Create Main Viewport Group
        const g = baseSvg.append("g")
            .attr("class", "main-viewport")
            .attr("transform", `translate(${margin.left}, ${height / 2})`)

        gRef.current = g as any

        // [OPTIMIZATION]: StructuredClone for clean hierarchy
        const rootData = structuredClone(data)
        const root = d3.hierarchy(rootData) as unknown as HierarchyPointNode
        root.x0 = 0
        root.y0 = 0
        rootRef.current = root

        // Initial setup (collapse root)
        if (root.children) {
            root._children = root.children as HierarchyPointNode[]
            root.children = undefined
        }

        // [D3 ZOOM SUPPORT]
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 2])
            .on("zoom", (event) => {
                g.attr("transform", event.transform.toString())
            })

        // Disable individual interaction but keep it on baseSvg
        baseSvg.call(zoom as any)
            .on("dblclick.zoom", null) // Prevent zoom on dblclick (interferes with toggle)

        updateTree(root)

        // [TERMINAL SYNC]: Expand path command
        const handlePathExpand = (e: any) => {
            const path = e.detail?.path as string
            if (!path || !rootRef.current) return

            const parts = path.toLowerCase().split('.')
            let current: any = rootRef.current

            parts.forEach((part, i) => {
                const candidates = current.children || current._children
                if (!candidates) return

                const found = candidates.find((c: any) => c.data.name.toLowerCase().includes(part))
                if (found) {
                    if (found._children) {
                        found.children = found._children
                        found._children = undefined
                    }
                    current = found
                    if (i === parts.length - 1) updateTree(found)
                }
            })
        }

        window.addEventListener('tree-expand', handlePathExpand)
        return () => window.removeEventListener('tree-expand', handlePathExpand)
    }, [data])

    // --- EFFECT 2: PREMIUM THEME TRANSITIONS ---
    useEffect(() => {
        const g = gRef.current
        if (!g) return

        // Transition links
        safeTransition(g.selectAll('path.link'), 500)
            .style("stroke", linkColor)

        // Transition nodes
        const nodes = g.selectAll('g.node')
        safeTransition(nodes.select('rect'), 500)
            .style("fill", nodeFill)
            .style("stroke", nodeStroke)

        safeTransition(nodes.select('text'), 500)
            .style("fill", textColor)

        safeTransition(nodes.select('.toggle-hint'), 500)
            .style("fill", isBright ? "rgba(0,0,0,0.3)" : "rgba(34,211,238,0.5)")

    }, [isBright, linkColor, nodeFill, nodeStroke, textColor])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "tree-overlay fixed inset-0 flex flex-col items-center justify-center p-0",
                "bg-black/95 backdrop-blur-[32px] z-[250]"
            )}
        >
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-visible">
                <svg ref={svgRef} className="w-full h-full block" style={{ overflow: 'visible' }} />
            </div>

            {/* EXIT_UI */}
            <button
                onClick={onClose}
                className="absolute bottom-12 right-12 flex items-center gap-4 px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group backdrop-blur-md shadow-2xl pointer-events-auto"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-black font-mono tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
                    TERMINATE_VIEW
                </span>
            </button>
        </motion.div>
    )
}
