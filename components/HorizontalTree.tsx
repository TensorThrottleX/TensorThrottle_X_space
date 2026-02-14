// 'use client'

// import React, { useEffect, useRef } from 'react'
// import * as d3 from 'd3'
// import { useUI } from '@/components/providers/UIProvider'

// interface TreeNode {
//     name: string
//     id?: string
//     children?: TreeNode[]
//     _children?: TreeNode[]
// }

// const initialData: TreeNode = {
//     name: "Tensor Throttle X",
//     children: [
//         {
//             name: "About",
//             children: [
//                 { name: "Vision" },
//                 { name: "Background" },
//                 { name: "Philosophy" }
//             ]
//         },
//         {
//             name: "Alignment",
//             children: [
//                 { name: "Tech Stack" },
//                 { name: "Systems Thinking" },
//                 { name: "Optimization" }
//             ]
//         },
//         {
//             name: "Interest",
//             children: [
//                 { name: "AI" },
//                 { name: "Architecture" },
//                 { name: "High Performance" }
//             ]
//         }
//     ]
// }

// export function HorizontalTree() {
//     const svgRef = useRef<SVGSVGElement>(null)
//     const containerRef = useRef<HTMLDivElement>(null)
//     const { uiMode, setUiMode } = useUI()
//     const isActive = uiMode === 'tree'

//     // Config: Exact match to requirements
//     const margin = { top: 20, right: 120, bottom: 20, left: 160 }
//     const duration = 600
//     const nodeWidth = 240 // Horizontal gap (prompt: 240px)
//     const nodeHeight = 90 // Vertical spacing (prompt: 90px between siblings)

//     useEffect(() => {
//         if (!isActive || !svgRef.current || !containerRef.current) return

//         const width = containerRef.current.clientWidth
//         const height = containerRef.current.clientHeight

//         // Clear existing
//         d3.select(svgRef.current).selectAll("*").remove()

//         const svg = d3.select(svgRef.current)
//             .attr("width", width)
//             .attr("height", height)
//             .append("g")
//             .attr("transform", `translate(${margin.left},${height / 2})`)

//         // Helper type for D3 hierarchy node with optional collapse state
//         type HierarchyNode = d3.HierarchyPointNode<TreeNode> & {
//             x0?: number
//             y0?: number
//             _children?: HierarchyNode[]
//         }

//         // Process data
//         const root = d3.hierarchy(initialData) as unknown as HierarchyNode
//         root.x0 = 0
//         root.y0 = 0

//         // Collapse helper
//         const collapse = (d: HierarchyNode) => {
//             if (d.children) {
//                 d._children = d.children as HierarchyNode[]
//                 d._children.forEach(collapse)
//                 d.children = undefined
//             }
//         }

//         // Initially collapse all children of root to support "expand from root" animation
//         if (root.children) {
//             root.children.forEach((d: any) => collapse(d))
//         }

//         // Initial render
//         update(root)

//         // Trigger expansion animation after mount
//         setTimeout(() => {
//             update(root)
//         }, 100)

//         function update(source: HierarchyNode) {
//             // Assign layout
//             // nodeSize: [vertical spacing, horizontal spacing] for vertical logic (x=y, y=x later)
//             const treeLayout = d3.tree<TreeNode>().nodeSize([nodeHeight, nodeWidth])

//             const treeData = treeLayout(root as any) as HierarchyNode
//             const nodes = treeData.descendants() as HierarchyNode[]
//             const links = treeData.links()

//             // Normalize for fixed horizontal depth
//             nodes.forEach((d) => { d.y = d.depth * nodeWidth })

//             // ****************** Nodes ******************
//             const node = svg.selectAll<SVGGElement, HierarchyNode>('g.node')
//                 .data(nodes, (d: HierarchyNode) => d.data.name)

//             const nodeEnter = node.enter().append('g')
//                 .attr('class', 'node')
//                 .attr("transform", (d: HierarchyNode) => `translate(${source.y0},${source.x0})`)
//                 .on('click', click)
//                 .on('mouseenter', mouseover as any)
//                 .on('mouseleave', mouseout as any)
//                 .style("cursor", "pointer")

//             // Capsule/Rect
//             nodeEnter.append('rect')
//                 .attr('rx', 20)
//                 .attr('ry', 20)
//                 .attr('width', 180)
//                 .attr('height', 44)
//                 .attr('y', -22)
//                 .attr('x', -10)
//                 .style("fill", "#2b2f36") // Base color
//                 .style("stroke", "#2e4b43")
//                 .style("stroke-width", "1px")
//                 .style("opacity", 0)

//             // Text
//             nodeEnter.append('text')
//                 .attr("dy", ".35em")
//                 .attr("x", 15)
//                 .attr("text-anchor", "start")
//                 .text((d: HierarchyNode) => d.data.name)
//                 .style("font-family", "Inter, sans-serif")
//                 .style("font-size", "14px")
//                 .style("font-weight", 500)
//                 .style("fill", "rgba(255,255,255,0.9)")
//                 .style("fill-opacity", 0)
//                 .style("pointer-events", "none")

//             // Expand/Collapse Indicator
//             nodeEnter.append('text')
//                 .attr('class', 'indicator')
//                 .attr('dy', '.35em')
//                 .attr('x', 155)
//                 .attr('text-anchor', 'end')
//                 .text((d: HierarchyNode) => d._children ? '>' : (d.children ? '<' : ''))
//                 .style("font-family", "monospace")
//                 .style("font-size", "14px")
//                 .style("fill", "#2e4b43")
//                 .style("opacity", 0)

//             // Update
//             const nodeUpdate = nodeEnter.merge(node)

//             nodeUpdate.transition()
//                 .duration(duration)
//                 .delay((d: HierarchyNode, i: number) => i * 80)
//                 .ease(d3.easeCubicOut)
//                 .attr("transform", (d: HierarchyNode) => `translate(${d.y},${d.x})`)

//             nodeUpdate.select('rect')
//                 .transition().duration(duration)
//                 .style("fill", (d: any) => d._children ? "#2b2f36" : "#1e1f23") // distinct slightly
//                 .style("stroke", (d: any) => d._children ? "#2e4b43" : "none") // Accented when collapsed? Or inactive?
//                 // Visual logic:
//                 // Collapsed (has _children) -> Clickable to expand -> Maybe distinct stroke?
//                 // Expanded (has children) -> maybe no stroke or subtle?
//                 // Let's stick to prompt: "No harsh borders". "Active nodes" -> muted green-teal accent.
//                 .style("stroke", "#2e4b43")
//                 .style("opacity", 1)

//             nodeUpdate.select('text')
//                 .transition().duration(duration)
//                 .style("fill-opacity", 1)

//             nodeUpdate.select('.indicator')
//                 .text((d: any) => d._children ? '>' : (d.children ? '<' : ''))
//                 .transition().duration(duration)
//                 .style("opacity", (d: any) => (d.children || d._children) ? 1 : 0)

//             // Exit
//             const nodeExit = node.exit().transition()
//                 .duration(duration)
//                 .attr("transform", ((d: HierarchyNode) => `translate(${source.y},${source.x})`) as any)
//                 .remove()

//             nodeExit.select('rect').style('opacity', 0)
//             nodeExit.select('text').style('fill-opacity', 0)
//             nodeExit.select('.indicator').style('opacity', 0)

//             // ****************** Links ******************
//             const link = svg.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>('path.link')
//                 .data(links, (d: any) => d.target.data.name)

//             const linkEnter = link.enter().insert('path', "g")
//                 .attr("class", "link")
//                 .attr('d', (d: any) => {
//                     const o = { x: source.x0 || 0, y: source.y0 || 0 }
//                     return diagonal(o, o)
//                 })
//                 .style("fill", "none")
//                 .style("stroke", "#2e4b43")
//                 .style("stroke-width", "1.6px")
//                 .style("stroke-opacity", 0)

//             const linkUpdate = linkEnter.merge(link)

//             linkUpdate.transition()
//                 .duration(duration)
//                 .ease(d3.easeCubicOut)
//                 .attr('d', (d: any) => diagonal(d.source as any, d.target as any))
//                 .style("stroke-opacity", 0.35)

//             link.exit().transition()
//                 .duration(duration)
//                 .attr('d', (d: any) => {
//                     const o = { x: source.x || 0, y: source.y || 0 }
//                     return diagonal(o, o)
//                 })
//                 .remove()

//             // Save old positions
//             nodes.forEach((d) => {
//                 d.x0 = d.x
//                 d.y0 = d.y
//             })

//             function diagonal(s: { x: number, y: number }, d: { x: number, y: number }) {
//                 return `M ${s.y} ${s.x}
//                         C ${(s.y + d.y) / 2} ${s.x},
//                           ${(s.y + d.y) / 2} ${d.x},
//                           ${d.y} ${d.x}`
//             }

//             function click(event: any, d: HierarchyNode) {
//                 if (d.children) {
//                     d._children = d.children as HierarchyNode[]
//                     d.children = undefined
//                 } else if (d._children) {
//                     d.children = d._children
//                     d._children = undefined
//                 }
//                 update(d)
//             }

//             function mouseover(event: any, d: HierarchyNode) {
//                 d3.select(event.currentTarget).select('rect')
//                     .transition().duration(200)
//                     .style("stroke", "#4fd1c5") // Highlight
//                     .style("filter", "drop-shadow(0 0 8px rgba(79, 209, 197, 0.3))")
//                     .attr("transform", "scale(1.02)") // Subtle scale
//             }

//             function mouseout(event: any, d: HierarchyNode) {
//                 d3.select(event.currentTarget).select('rect')
//                     .transition().duration(200)
//                     .style("stroke", "#2e4b43")
//                     .style("filter", "none")
//                     .attr("transform", "scale(1)")
//             }
//         }

//     }, [isActive])

//     return (
//         <>
//             {/* [SCREENSHOT]: 'INITIALIZE SYSTEM' Button
//                 - Rendered here creates the entry point to the tree visualization.
//                 - Located on the left side of the screen as seen in the screenshot.
//             */}
//             {!isActive && (
//                 <button
//                     onClick={() => setUiMode('tree')}
//                     className="fixed top-[120px] left-[60px] z-[60] flex items-center gap-3 text-white/60 hover:text-white transition-all group pointer-events-auto"
//                 >
//                     <div className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 group-hover:shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all" />
//                     <span className="text-sm font-mono tracking-widest uppercase opacity-80 group-hover:opacity-100">
//                         Initialize System
//                     </span>
//                 </button>
//             )}

//             {/* Tree Container */}
//             <div
//                 ref={containerRef}
//                 className={`tree-container fixed inset-0 z-40 transition-all duration-1000 flex items-center justify-center ${isActive ? 'bg-transparent pointer-events-auto opacity-100 visible' : 'pointer-events-none opacity-0 invisible'}`}
//             >
//                 <svg ref={svgRef} className="w-full h-full block" style={{ overflow: 'visible' }} />

//                 {/* Close Button when initialized */}
//                 {isActive && (
//                     <button
//                         onClick={() => setUiMode('default')}
//                         className="fixed top-[200px] left-[60px] z-[60] flex items-center gap-3 text-red-400/60 hover:text-red-400 transition-all group"
//                     >
//                         <div className="w-2 h-2 rounded-full bg-red-900/50 group-hover:bg-red-500 transition-all" />
//                         <span className="text-xs font-mono tracking-widest uppercase opacity-80 group-hover:opacity-100">
//                             Terminate
//                         </span>
//                     </button>
//                 )}
//             </div>
//         </>
//     )
// }
