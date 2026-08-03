'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TreeNode } from '@/lib/dashboard-data'

interface PositionedNode {
  id: string
  name: string
  x: number
  y: number
  depth: number
  children: string[]
  isLeaf: boolean
}

interface GraphEdge {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

interface KnowledgeTreeProps {
  data: TreeNode
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onClose: () => void
  onReset: () => void
  isBright: boolean
}

const LEVEL_GAP = 280
const SIBLING_GAP = 70
const getCardWidth = (name: string, isRoot: boolean = false) => {
  const base = Math.max(140, (name?.length || 0) * 7.5 + 50)
  return isRoot ? base + 20 : base
}
const getCardHeight = (isRoot: boolean = false) => isRoot ? 48 : 42

function buildTree(node: TreeNode, depth = 0, idPath = 'root', map = new Map<string, PositionedNode>()): { height: number, id: string } {
  const id = idPath
  const hasChildren = Array.isArray(node.children) && node.children.length > 0

  if (!hasChildren) {
    map.set(id, { id, name: node.name || 'Unknown', x: depth * LEVEL_GAP, y: 0, depth, children: [], isLeaf: true })
    return { height: 1, id }
  }

  const childIds: string[] = []
  let totalHeight = 0
  const childHeights: number[] = []

  node.children!.forEach((child, i) => {
    if (!child) return
    const res = buildTree(child, depth + 1, `${id}.${i}`, map)
    childIds.push(res.id)
    childHeights.push(res.height)
    totalHeight += res.height
  })

  // If all children were invalid, treat as leaf
  if (childIds.length === 0) {
    map.set(id, { id, name: node.name || 'Unknown', x: depth * LEVEL_GAP, y: 0, depth, children: [], isLeaf: true })
    return { height: 1, id }
  }

  let yAcc = -totalHeight / 2
  childIds.forEach((childId, i) => {
    const h = childHeights[i]
    const childNode = map.get(childId)
    if (childNode) {
      childNode.y = (yAcc + h / 2) * SIBLING_GAP
    }
    yAcc += h
  })

  map.set(id, { id, name: node.name || 'Unknown', x: depth * LEVEL_GAP, y: 0, depth, children: childIds, isLeaf: false })

  return { height: totalHeight, id }
}

function computeAbsolutePositions(map: Map<string, PositionedNode>, id = 'root', absY = 0) {
  const node = map.get(id)!
  node.y += absY
  for (const childId of node.children) {
    computeAbsolutePositions(map, childId, node.y)
  }
}

function assignPositions(node: TreeNode): { map: Map<string, PositionedNode> } {
  console.log('--- Pipeline Trace: assignPositions ---')
  console.log('KNOWLEDGE_TREE Valid Data:', !!node && typeof node === 'object' && node.name !== undefined)
  const map = new Map<string, PositionedNode>()
  buildTree(node, 0, 'root', map)
  console.log('buildTree - root created:', map.has('root'))
  console.log('buildTree - nodeMap size:', map.size)
  computeAbsolutePositions(map, 'root', 0)
  const rootNode = map.get('root')
  console.log('computeAbsolutePositions - root coordinates finite:', rootNode ? (Number.isFinite(rootNode.x) && Number.isFinite(rootNode.y)) : false)
  return { map }
}

function computeVisible(nodeMap: Map<string, PositionedNode>, expandedIds: Set<string>): Set<string> {
  const visible = new Set<string>()
  function walk(id: string) {
    if (!nodeMap.has(id)) return
    visible.add(id)
    const n = nodeMap.get(id)
    if (n && expandedIds.has(id) && Array.isArray(n.children)) {
      for (const c of n.children) walk(c)
    }
  }
  walk('root')
  return visible
}

function getAllIds(node: TreeNode, path = 'root'): string[] {
  const ids = [path]
  if (node.children) {
    node.children.forEach((child, i) => ids.push(...getAllIds(child, `${path}.${i}`)))
  }
  return ids
}

export function KnowledgeTree({
  data, expandedIds, onToggle, onClose, onReset, isBright,
}: KnowledgeTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const panning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 })
  const origin = useRef({ x: 0, y: 0 })

  const allIds = useMemo(() => getAllIds(data), [data])
  const { map: nodeMap } = useMemo(() => assignPositions(data), [data])
  const visibleSet = useMemo(() => computeVisible(nodeMap, expandedIds), [nodeMap, expandedIds])
  const rootNode = nodeMap.get('root')!

  // Center the root on mount (left-middle)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setView({
        x: window.innerWidth * 0.15,
        y: window.innerHeight / 2,
        scale: 0.85,
      })
    }
  }, [])

  // Build visible edges
  const edges: GraphEdge[] = useMemo(() => {
    const result: GraphEdge[] = []
    for (const id of visibleSet) {
      const n = nodeMap.get(id)
      if (!n) continue
      const isRoot = id === 'root'
      const nWidth = getCardWidth(n.name, isRoot)
      for (const c of n.children) {
        if (!visibleSet.has(c)) continue
        const child = nodeMap.get(c)
        if (!child) continue
        const childWidth = getCardWidth(child.name, false)
        result.push({
          from: id,
          to: c,
          fromX: n.x + nWidth / 2,
          fromY: n.y,
          toX: child.x - childWidth / 2,
          toY: child.y,
        })
      }
    }
    return result
  }, [nodeMap, visibleSet])

  // Build visible nodes
  const nodes: PositionedNode[] = useMemo(
    () => Array.from(visibleSet).map((id) => nodeMap.get(id)!).filter(Boolean),
    [nodeMap, visibleSet],
  )

  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[Tree Diagnostics]')
    console.log('Tree Loaded:', !!data)
    console.log('Root ID: root')
    console.log('Tree Data Valid:', !!data && typeof data === 'object')
    console.log('NodeMap Size:', nodeMap.size)
    console.log('Root Exists:', !!nodeMap.get('root'))
    console.log('Expanded IDs:', Array.from(expandedIds).join(','))
    console.log('Visible Set Size:', visibleSet.size)
    console.log('Visible Nodes:', nodes.length)
    console.log('Visible Edges:', edges.length)
    console.log('Root Coordinates:', nodeMap.get('root')?.x, nodeMap.get('root')?.y)
    console.log('First Child Count:', nodeMap.get('root')?.children.length)
    setTimeout(() => {
      console.log('SVG Nodes Rendered:', svgRef.current?.querySelectorAll('g[data-node]').length || 0)
      console.log('SVG Edges Rendered:', svgRef.current?.querySelectorAll('line').length || 0)
    }, 100)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [data, nodeMap, nodes, edges, expandedIds, view, visibleSet])

  // Which nodes are newly visible (for pulse animation)
  const prevVisible = useRef<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    const fresh = new Set<string>()
    for (const id of visibleSet) {
      if (!prevVisible.current.has(id)) fresh.add(id)
    }
    setNewIds(fresh)
    prevVisible.current = new Set(visibleSet)
    if (fresh.size > 0) {
      const t = setTimeout(() => setNewIds(new Set()), 1200)
      return () => clearTimeout(t)
    }
  }, [visibleSet])

  // Pan handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as Element
    if (target.closest('g[data-node]') || target.closest('button')) return
    panning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    if (svgRef.current) svgRef.current.setPointerCapture(e.pointerId)
  }, [view])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setView((v) => ({ ...v, x: panStart.current.vx + dx, y: panStart.current.vy + dy }))
  }, [])

  const onPointerUp = useCallback(() => {
    panning.current = false
  }, [])

  // Wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.92
    setView((v) => ({
      ...v,
      scale: Math.max(0.3, Math.min(3, v.scale * factor)),
      x: e.clientX - (e.clientX - v.x) * factor,
      y: e.clientY - (e.clientY - v.y) * factor,
    }))
  }, [])

  // Touch zoom (pinch)
  const lastPinchDist = useRef(0)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const factor = dist / lastPinchDist.current
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      setView((v) => ({
        ...v,
        scale: Math.max(0.3, Math.min(3, v.scale * factor)),
        x: cx - (cx - v.x) * factor,
        y: cy - (cy - v.y) * factor,
      }))
      lastPinchDist.current = dist
    }
  }, [])

  const TEXT_COLOR = isBright ? '#1c1c1c' : '#e5e5e5'
  const MUTED_COLOR = isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'
  const CYAN = '#22d3ee'
  const CYAN_DIM = 'rgba(34,211,238,0.25)'
  const NODE_BG = isBright ? 'rgba(245,245,244,0.85)' : 'rgba(5,5,5,0.75)'
  const NODE_BORDER = isBright ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'

  const content = (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Cinematic Backdrop */}
      <motion.div
        className="absolute inset-0 pointer-events-auto"
        initial={{ backdropFilter: 'blur(0px) saturate(100%)', backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ backdropFilter: 'blur(12px) saturate(60%)', backgroundColor: 'rgba(0,0,0,0.7)' }}
        exit={{ backdropFilter: 'blur(0px) saturate(100%)', backgroundColor: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Exit & Reset */}
      <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-4 pointer-events-auto">
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: isBright ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
            color: MUTED_COLOR,
            border: `1px solid ${NODE_BORDER}`,
          }}
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-md flex items-center gap-2"
          style={{
            backgroundColor: isBright ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,20,0.8)',
            color: CYAN,
            border: `1px solid ${CYAN_DIM}`,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Terminate Tree
        </button>
      </div>

      {/* Root label */}
      <motion.div
        className="fixed top-6 left-6 z-10 text-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ color: CYAN }}
      >
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
          {data.name}
        </span>
      </motion.div>

      {/* SVG */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none pointer-events-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <filter id="kt-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="edge-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={CYAN} stopOpacity={0.7} />
            <stop offset="100%" stopColor={CYAN} stopOpacity={0.15} />
          </linearGradient>
        </defs>

        <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
          {/* Edges */}
          <AnimatePresence>
            {edges.map((edge) => {
              const edgeId = `${edge.from}→${edge.to}`
              const cx1 = edge.fromX + (edge.toX - edge.fromX) * 0.4
              const cy1 = edge.fromY
              const cx2 = edge.toX - (edge.toX - edge.fromX) * 0.4
              const cy2 = edge.toY
              const d = `M ${edge.fromX} ${edge.fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${edge.toX} ${edge.toY}`

              return (
                <motion.path
                  key={edgeId}
                  d={d}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  stroke="url(#edge-gradient)"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </AnimatePresence>

          {/* Nodes */}
          <AnimatePresence>
            {nodes.map((n) => {
              const isExpanded = expandedIds.has(n.id)
              const isNew = newIds.has(n.id)
              const isRoot = n.id === 'root'
              const w = getCardWidth(n.name, isRoot)
              const h = getCardHeight(isRoot)
              const clickable = !!(n.children && n.children.length > 0)

              return (
                <motion.g
                  key={n.id}
                  data-node={n.id}
                  initial={{ scale: isNew ? 0.9 : 1, opacity: isNew ? 0 : 1, x: isNew ? -20 : 0 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 25,
                    mass: 0.8,
                    delay: isNew ? (isRoot ? 0.2 : 0.1) : 0,
                  }}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}
                  onClick={() => clickable && onToggle(n.id)}
                >
                  {/* Card Base */}
                  <motion.rect
                    x={n.x - w / 2}
                    y={n.y - h / 2}
                    width={w}
                    height={h}
                    rx={14}
                    fill={isBright ? 'rgba(250,250,250,0.85)' : 'rgba(15,15,18,0.85)'}
                    stroke={isExpanded || isRoot ? CYAN : NODE_BORDER}
                    strokeWidth={isRoot ? 1.5 : 1}
                    style={{
                      filter: isExpanded || isRoot ? 'drop-shadow(0 0 12px rgba(34,211,238,0.3))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                      transition: 'filter 0.4s ease, stroke 0.4s ease',
                    }}
                  />

                  {/* Root Glow Pulse */}
                  {isRoot && (
                    <motion.rect
                      x={n.x - w / 2}
                      y={n.y - h / 2}
                      width={w}
                      height={h}
                      rx={14}
                      fill="none"
                      stroke={CYAN}
                      strokeWidth={1.5}
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.08 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                    />
                  )}

                  {/* Expand/collapse indicator */}
                  {!n.isLeaf && (
                    <g transform={`translate(${n.x + w / 2 - 20}, ${n.y})`}>
                      <circle
                        r={10}
                        fill={isExpanded ? CYAN : (isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')}
                      />
                      <motion.path
                        d="M -2 -3 L 2 0 L -2 3"
                        stroke={isExpanded ? (isBright ? '#fff' : '#000') : CYAN}
                        fill="none"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={false}
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </g>
                  )}

                  {/* Label */}
                  <text
                    x={n.x - w / 2 + 18}
                    y={n.y + 4}
                    textAnchor="start"
                    fill={TEXT_COLOR}
                    fontSize={isRoot ? 14 : 12}
                    fontWeight={isRoot ? 700 : 500}
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.02em"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {n.name}
                  </text>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </g>
      </svg>
    </motion.div>
  )

  if (typeof document === 'undefined') return content

  // Use createPortal to escape any stacking contexts / transforms in parent elements
  const { createPortal } = require('react-dom')
  return createPortal(content, document.body)
}
