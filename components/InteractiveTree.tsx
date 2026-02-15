'use client'

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TREE_ANIMATION_CONFIG } from '@/lib/tree-animations'

export interface TreeNode {
    name: string
    id?: string
    children?: TreeNode[]
    _children?: TreeNode[]
}

interface InteractiveTreeProps {
    data: TreeNode
    onClose: () => void
    standalone?: boolean
}

export function InteractiveTree({ data, onClose, standalone = false }: InteractiveTreeProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isTransitioning = useRef(false)
    const lockTimer = useRef<NodeJS.Timeout | null>(null)

    // Config: Exact match to requirements
    const margin = standalone
        ? { top: 10, right: 40, bottom: 10, left: 40 }
        : { top: 20, right: 120, bottom: 20, left: 160 }

    const nodeWidth = standalone ? 220 : 280
    const nodeHeight = standalone ? 70 : 90

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return

        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight

        // Clear existing
        d3.select(svgRef.current).selectAll("*").remove()

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "main-g")
            .attr("transform", `translate(${margin.left},${height / 2})`)

        // Interaction Guard
        const setLock = (durationMs: number) => {
            isTransitioning.current = true
            if (lockTimer.current) clearTimeout(lockTimer.current)
            lockTimer.current = setTimeout(() => {
                isTransitioning.current = false
            }, durationMs)
        }

        // Helper type for D3 hierarchy node
        type HierarchyNode = d3.HierarchyPointNode<TreeNode> & {
            x0?: number
            y0?: number
            _children?: HierarchyNode[]
        }

        // Process data
        const root = d3.hierarchy(JSON.parse(JSON.stringify(data))) as unknown as HierarchyNode
        root.x0 = 0
        root.y0 = 0

        const collapse = (d: HierarchyNode) => {
            if (d.children) {
                d._children = d.children as HierarchyNode[]
                d._children.forEach(collapse)
                d.children = undefined
            }
        }

        if (root.children) {
            root.children.forEach((d: any) => collapse(d))
        }

        const update = (source: HierarchyNode, isFirstLoad = false) => {
            const treeLayout = d3.tree<TreeNode>().nodeSize([nodeHeight, nodeWidth])
            const treeData = treeLayout(root as any) as HierarchyNode
            const nodes = treeData.descendants() as HierarchyNode[]
            const links = treeData.links()

            nodes.forEach((d) => { d.y = d.depth * nodeWidth })

            // Lock during update
            setLock(TREE_ANIMATION_CONFIG.DURATION.CONTAINER * 1000 + 400)

            // ****************** Links ******************
            const link = svg.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>('path.link')
                .data(links, (d: any) => d.target.data.name + d.target.depth)

            const linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', (d: any) => {
                    const o = { x: source.x0 || 0, y: source.y0 || 0 }
                    return diagonal(o, o)
                })
                .style("fill", "none")
                .style("stroke", "#2e4b43")
                .style("stroke-width", "1.6px")
                .style("stroke-opacity", 0)
                .style("stroke-dasharray", "1000")
                .style("stroke-dashoffset", "1000")

            const linkUpdate = linkEnter.merge(link)

            // Phase 2: Connector Extension (Expansion) or Retraction (Collapse)
            linkUpdate.transition()
                .duration(TREE_ANIMATION_CONFIG.DURATION.CONNECTOR * 1000)
                .delay(TREE_ANIMATION_CONFIG.DELAY.CONNECTOR * 1000)
                .ease(d3.easeCubic) // Approximation of [0.4, 0, 0.2, 1]
                .attr('d', (d: any) => diagonal(d.source as any, d.target as any))
                .style("stroke-opacity", 0.35)
                .style("stroke-dashoffset", "0")

            link.exit().transition()
                .duration(TREE_ANIMATION_CONFIG.DURATION.COLLAPSE_CONNECTOR * 1000)
                .style("stroke-dashoffset", "1000")
                .style("stroke-opacity", 0)
                .remove()

            // ****************** Nodes ******************
            const node = svg.selectAll<SVGGElement, HierarchyNode>('g.node')
                .data(nodes, (d: HierarchyNode) => d.data.name + d.depth)

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", `translate(${source.y0},${source.x0})`)
                .on('click', (e, d) => !isTransitioning.current && click(e, d))
                .on('mouseenter', mouseover as any)
                .on('mouseleave', mouseout as any)
                .style("cursor", "pointer")
                .style("opacity", 0)

            // Capsule/Rect
            nodeEnter.append('rect')
                .attr('rx', 20)
                .attr('ry', 20)
                .attr('height', standalone ? 36 : 44)
                .attr('y', standalone ? -18 : -22)
                .attr('x', -10)
                .attr('width', (d: HierarchyNode) => {
                    const textLen = d.data.name.length;
                    const multiplier = standalone ? 8 : 9;
                    return Math.max(standalone ? 140 : 180, textLen * multiplier + 40);
                })
                .style("fill", "#2b2f36")
                .style("stroke", "#2e4b43")
                .style("stroke-width", "1.6px")

            // Text
            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("x", 15)
                .attr("text-anchor", "start")
                .text((d: HierarchyNode) => d.data.name)
                .style("font-family", "Inter, sans-serif")
                .style("font-size", standalone ? "12px" : "14px")
                .style("font-weight", 500)
                .style("fill", "rgba(255,255,255,0.9)")
                .style("pointer-events", "none")

            // Indicator
            nodeEnter.append('text')
                .attr('class', 'indicator')
                .attr('dy', '.35em')
                .attr('x', (d: HierarchyNode) => {
                    const textLen = d.data.name.length;
                    const multiplier = standalone ? 8 : 9;
                    return Math.max(standalone ? 140 : 180, textLen * multiplier + 40) - 25;
                })
                .attr('text-anchor', 'end')
                .text((d: HierarchyNode) => d._children ? '>' : (d.children ? '<' : ''))
                .style("font-family", "monospace")
                .style("font-size", standalone ? "11px" : "14px")
                .style("fill", "#2e4b43")

            // Phase 1 & 3: Movement & Reveal
            const nodeUpdate = nodeEnter.merge(node)

            nodeUpdate.transition()
                .duration(TREE_ANIMATION_CONFIG.DURATION.CONTAINER * 1000)
                .ease(d3.easeCubic)
                .attr("transform", (d: HierarchyNode) => `translate(${d.y},${d.x})`)
                .style("opacity", 1)

            nodeUpdate.select('.indicator')
                .text((d: any) => d._children ? '>' : (d.children ? '<' : ''))
                .style("opacity", (d: any) => (d.children || d._children) ? 1 : 0)

            // Exit (Collapse Phase 1 & 3)
            const nodeExit = node.exit().transition()
                .duration(TREE_ANIMATION_CONFIG.DURATION.COLLAPSE_CONTAINER * 1000)
                .attr("transform", `translate(${source.y},${source.x})`)
                .style("opacity", 0)
                .remove()

            nodes.forEach((d) => {
                d.x0 = d.x
                d.y0 = d.y
            })

            function diagonal(s: { x: number, y: number }, d: { x: number, y: number }) {
                return `M ${s.y} ${s.x} C ${(s.y + d.y) / 2} ${s.x}, ${(s.y + d.y) / 2} ${d.x}, ${d.y} ${d.x}`
            }

            function click(event: any, d: HierarchyNode) {
                if (d.children) {
                    d._children = d.children as HierarchyNode[]
                    d.children = undefined
                } else if (d._children) {
                    d.children = d._children
                    d._children = undefined
                }
                update(d)
            }

            function mouseover(event: any, d: HierarchyNode) {
                if (isTransitioning.current) return
                d3.select(event.currentTarget).select('rect')
                    .transition().duration(200)
                    .style("stroke", "#4fd1c5")
                    .style("filter", "drop-shadow(0 0 8px rgba(79, 209, 197, 0.3))")
                    .attr("transform", "scale(1.02)")
            }

            function mouseout(event: any, d: HierarchyNode) {
                d3.select(event.currentTarget).select('rect')
                    .transition().duration(200)
                    .style("stroke", "#2e4b43")
                    .style("filter", "none")
                    .attr("transform", "scale(1)")
            }
        }

        update(root, true)
        setTimeout(() => update(root), 100)

    }, [data, standalone])

    return (
        <div
            ref={containerRef}
            className={cn(
                "tree-container flex items-center justify-center animate-in fade-in duration-500",
                standalone
                    ? "w-full h-full relative p-4 bg-transparent backdrop-blur-none"
                    : "fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            )}
        >
            <svg ref={svgRef} className="w-full h-full block" style={{ overflow: 'visible' }} />

            {!standalone && (
                <button
                    onClick={onClose}
                    className="fixed bottom-12 left-12 z-[60] flex items-center gap-3 text-red-400/60 hover:text-red-400 transition-[color,opacity] group"
                >
                    <div className="w-2 h-2 rounded-full bg-red-900/50 group-hover:bg-red-500 transition-colors" />
                    <span className="text-xs font-mono tracking-normal uppercase opacity-80 group-hover:opacity-100">
                        Terminate
                    </span>
                </button>
            )}
        </div>
    )
}
