'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TreeNode } from '@/lib/dashboard-data'

const LEVEL_GAP = 280
const SLOT_HEIGHT = 70

// ─────────────────────────────────────────────────────────────────────────────
// MOTION LANGUAGE — calm, deliberate, engineered.
// GPU-friendly: transforms + opacity only (connectors use pathLength draw).
// No springs. No bounce. EASE_SMOOTH is the signature curve: fast start,
// long silky settle — reads as weight, not snap.
// ─────────────────────────────────────────────────────────────────────────────
const EASE_SMOOTH: [number, number, number, number] = [0.16, 1, 0.3, 1]
const EASE_IN_OUT_CUBIC: [number, number, number, number] = [0.645, 0.045, 0.355, 1]
const EASE_OUT_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1]
const EASE_IN_QUART: [number, number, number, number] = [0.895, 0.03, 0.685, 0.22]

const MOTION = {
  CONNECTOR_DRAW: 0.35, //  connector grows from parent: 350ms
  CONNECTOR_RETRACT: 0.3, // connector rolls back into parent: 300ms
  NODE_IN: 0.3, //         child settles in: 300ms
  NODE_OUT: 0.22, //       child folds toward parent: 220ms
  STAGGER: 0.045, //       45ms between siblings
  REPOSITION: 0.45, //     layout reflow while positions change
}

// ─────────────────────────────────────────────────────────────────────────────
// MONOCHROME PALETTE — matte black / white / soft gray. No accent colors.
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  LINK: '#5a5a5a',
  LINK_OPACITY: 0.55,
  BORDER: 'rgba(255,255,255,0.16)',
  BORDER_MID: 'rgba(255,255,255,0.5)',
  BORDER_HOVER: 'rgba(255,255,255,0.8)',
  BORDER_ACTIVE: 'rgba(255,255,255,0.92)',
  BORDER_ROOT: 'rgba(255,255,255,0.85)',
  TEXT: '#ffffff',
  TEXT_MUTED: 'rgba(255,255,255,0.42)',
  RED: '#e11d48',
}

function getCardWidth(name: string, isRoot = false) {
  const base = Math.max(130, (name?.length || 0) * 7.5 + 40)
  return isRoot ? base + 24 : base
}
function getCardHeight(isRoot = false) {
  return isRoot ? 54 : 42
}

interface PositionedNode {
  id: string
  name: string
  x: number
  y: number
  parentId: string | null
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

interface GraphEdge {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

function buildSpanCache(
  node: TreeNode,
  expandedIds: Set<string>,
  prefix: string,
  cache: Map<string, number>,
  isRoot: boolean,
): number {
  const id = prefix ? `${prefix}/${node.name}` : node.name
  const existing = cache.get(id)
  if (existing !== undefined) return existing

  if (!node.children?.length) {
    cache.set(id, 1)
    return 1
  }
  if (!isRoot && !expandedIds.has(id)) {
    cache.set(id, 1)
    return 1
  }

  let total = 0
  for (const child of node.children) {
    total += buildSpanCache(child, expandedIds, id, cache, false)
  }
  const span = Math.max(1, total)
  cache.set(id, span)
  return span
}

function buildNodeMap(
  node: TreeNode,
  expandedIds: Set<string>,
  spanCache: Map<string, number>,
  prefix: string,
  depth: number,
  yStart: number,
  parentId: string | null,
  results: Map<string, PositionedNode>,
): void {
  const id = prefix ? `${prefix}/${node.name}` : node.name
  const isRoot = depth === 0
  const isExpanded = isRoot || expandedIds.has(id)
  const hasChildren = !!node.children?.length
  const span = spanCache.get(id) ?? 1

  const y = (yStart + (span - 1) / 2) * SLOT_HEIGHT

  results.set(id, {
    id,
    name: node.name,
    x: depth * LEVEL_GAP,
    y,
    parentId,
    depth,
    hasChildren,
    isExpanded,
  })

  if (isExpanded && hasChildren && node.children) {
    let childY = yStart
    for (const child of node.children) {
      const childSpan = spanCache.get(`${id}/${child.name}`) ?? 1
      buildNodeMap(child, expandedIds, spanCache, id, depth + 1, childY, id, results)
      childY += childSpan
    }
  }
}

function computeLayout(data: TreeNode, expandedIds: Set<string>) {
  const spanCache = new Map<string, number>()
  buildSpanCache(data, expandedIds, '', spanCache, true)

  const nodeMap = new Map<string, PositionedNode>()
  buildNodeMap(data, expandedIds, spanCache, '', 0, 0, null, nodeMap)

  const nodes = Array.from(nodeMap.values())
  const edges: GraphEdge[] = []

  for (const node of nodes) {
    if (!node.parentId) continue
    const parent = nodeMap.get(node.parentId)
    if (!parent) continue
    const pW = getCardWidth(parent.name, parent.depth === 0)
    const cW = getCardWidth(node.name, false)
    edges.push({
      id: `${parent.id}→${node.id}`,
      fromX: parent.x + pW / 2,
      fromY: parent.y,
      toX: node.x - cW / 2,
      toY: node.y,
    })
  }

  return { nodes, edges, nodeMap }
}

/** Smooth cubic Bézier — gentle S from parent to child. */
function edgePath(edge: GraphEdge) {
  const dx = edge.toX - edge.fromX
  const cx1 = edge.fromX + dx * 0.45
  const cx2 = edge.toX - dx * 0.45
  return `M ${edge.fromX} ${edge.fromY} C ${cx1} ${edge.fromY}, ${cx2} ${edge.toY}, ${edge.toX} ${edge.toY}`
}

interface InteractiveTreeViewProps {
  data: TreeNode
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onClose: () => void
  onReset: () => void
  isBright: boolean
}

export function InteractiveTreeView({
  data,
  expandedIds,
  onToggle,
  onClose,
  onReset,
  isBright: _isBright,
}: InteractiveTreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 0, y: 0 })
  const panning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  const [terminating, setTerminating] = useState(false)
  const terminateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { nodes, edges } = useMemo(() => computeLayout(data, expandedIds), [data, expandedIds])

  // Sibling order per parent → drives the +35ms cascade
  const siblingIndex = useMemo(() => {
    const map = new Map<string, number>()
    const groups = new Map<string, PositionedNode[]>()
    for (const n of nodes) {
      const key = n.parentId ?? ''
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(n)
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.y - b.y)
      group.forEach((n, i) => map.set(n.id, i))
    }
    return map
  }, [nodes])

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = nodes.find((n) => n.depth === 0)
      if (root) {
        setView({
          x: window.innerWidth * 0.15 - root.x,
          y: window.innerHeight / 2 - root.y,
        })
      }
    }
  }, [])

  const handleNodeClick = useCallback(
    (id: string, hasChildren: boolean, parentId: string | null) => {
      if (terminating) return
      if (hasChildren) {
        onToggle(id)
      } else if (parentId) {
        onToggle(parentId)
      }
    },
    [onToggle, terminating],
  )

  const handleTerminate = useCallback(() => {
    if (terminating) return
    setTerminating(true)
    terminateTimer.current = setTimeout(onClose, 480)
  }, [terminating, onClose])

  useEffect(() => {
    return () => {
      if (terminateTimer.current) clearTimeout(terminateTimer.current)
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as Element
      if (target.closest('[data-node]') || target.closest('button')) return
      panning.current = true
      panStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
      if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId)
    },
    [view],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setView((v) => ({ ...v, x: panStart.current.vx + dx, y: panStart.current.vy + dy }))
  }, [])

  const onPointerUp = useCallback(() => {
    panning.current = false
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE_IN_OUT_CUBIC }}
    >
      {/* Matte black backdrop — flat, no blur */}
      <motion.div
        className="absolute inset-0 pointer-events-auto"
        initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
        exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.6, ease: EASE_IN_OUT_CUBIC }}
      />

      {/* Soft vignette — matte depth, no color */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-4 pointer-events-auto">
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all duration-300 bg-white/[0.04] border border-white/10 text-white/40 hover:bg-white/[0.07] hover:border-white/25 hover:text-white/70"
        >
          Reset
        </button>
        <button
          onClick={handleTerminate}
          disabled={terminating}
          className="group px-6 py-2.5 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all duration-300 bg-white/[0.05] border border-white/20 text-white hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-100 hover:shadow-[0_0_24px_rgba(225,29,72,0.35)] disabled:opacity-60 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-white/50 transition-colors duration-300 group-hover:bg-red-500 group-hover:shadow-[0_0_8px_rgba(225,29,72,0.9)]" />
          Terminate Tree
        </button>
      </div>

      {/* Termination rod — red strike across the tree */}
      <AnimatePresence>
        {terminating && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-full h-[3px]"
              style={{
                backgroundColor: P.RED,
                boxShadow:
                  '0 0 24px rgba(225,29,72,0.8), 0 0 64px rgba(225,29,72,0.4)',
                transformOrigin: 'center',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE_SMOOTH }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed top-6 left-6 z-10 text-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ color: P.TEXT }}
      >
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
          {data.name}
        </span>
      </motion.div>

      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none pointer-events-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${view.x}px, ${view.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          <svg
            width={5000}
            height={5000}
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            <AnimatePresence>
              {edges.map((edge) => (
                <motion.path
                  key={edge.id}
                  d={edgePath(edge)}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: P.LINK_OPACITY }}
                  exit={{
                    pathLength: 0,
                    opacity: 0,
                    transition: {
                      duration: MOTION.CONNECTOR_RETRACT,
                      delay: MOTION.NODE_OUT,
                      ease: EASE_IN_OUT_CUBIC,
                    },
                  }}
                  transition={{ duration: MOTION.CONNECTOR_DRAW, ease: EASE_SMOOTH }}
                  stroke={P.LINK}
                  strokeWidth={1.25}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </AnimatePresence>
          </svg>

          <AnimatePresence>
            {nodes.map((node) => {
              const isRoot = node.depth === 0
              const isActive = node.isExpanded
              const w = getCardWidth(node.name, isRoot)
              const h = getCardHeight(isRoot)
              const sibling = siblingIndex.get(node.id) ?? 0
              const parent = node.parentId ? nodeById.get(node.parentId) : undefined

              // Connectors draw first (0.35s), then children cascade in (+45ms each)
              const enterDelay = isRoot ? 0 : MOTION.CONNECTOR_DRAW + sibling * MOTION.STAGGER
              const foldX = (parent ? parent.x : node.x) - node.x
              const foldY = (parent ? parent.y : node.y) - node.y

              return (
                <motion.div
                  key={node.id}
                  data-node={node.id}
                  className="absolute"
                  style={{
                    left: node.x - w / 2,
                    top: node.y - h / 2,
                    width: w,
                    height: h,
                    cursor: 'pointer',
                    transition: `left ${MOTION.REPOSITION}s cubic-bezier(0.16,1,0.3,1), top ${MOTION.REPOSITION}s cubic-bezier(0.16,1,0.3,1)`,
                  }}
                  initial={{ opacity: 0, scale: 0.94, x: -14 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.97,
                    x: foldX,
                    y: foldY,
                    transition: { duration: MOTION.NODE_OUT, ease: EASE_IN_QUART },
                  }}
                  transition={
                    isRoot
                      ? { duration: 0.5, ease: EASE_SMOOTH }
                      : { duration: MOTION.NODE_IN, delay: enterDelay, ease: EASE_SMOOTH }
                  }
                  onClick={() => handleNodeClick(node.id, node.hasChildren, node.parentId)}
                >
                  {/* Root — soft breathing glow (origin of the tree) */}
                  {isRoot && (
                    <motion.div
                      className="absolute -inset-3 rounded-[18px] pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(255,255,255,0.09) 0%, transparent 72%)',
                      }}
                      animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Active node — very subtle static white glow */}
                  {isActive && !isRoot && (
                    <div
                      className="absolute -inset-2 rounded-[16px] pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, transparent 70%)',
                      }}
                    />
                  )}

                  <motion.div
                    className="w-full h-full rounded-[14px] flex items-center px-[18px] relative overflow-hidden"
                    style={{
                      backgroundColor: '#000000',
                      borderWidth: isRoot ? 2 : node.depth <= 1 ? 1.25 : 1,
                      borderStyle: 'solid',
                    }}
                    animate={{
                      borderColor: isRoot
                        ? isActive ? P.BORDER_ACTIVE : P.BORDER_ROOT
                        : isActive ? P.BORDER_ACTIVE : P.BORDER,
                      scale: isActive ? 1.03 : 1,
                    }}
                    whileHover={{
                      y: -3,
                      scale: isActive ? 1.04 : 1.02,
                      borderColor: P.BORDER_HOVER,
                      boxShadow:
                        '0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.05)',
                    }}
                    transition={{ duration: 0.3, ease: EASE_SMOOTH }}
                  >
                    <span
                      className="font-mono truncate"
                      style={{
                        color: P.TEXT,
                        fontSize: isRoot ? 14 : node.depth <= 1 ? 12.5 : 12,
                        fontWeight: isRoot ? 700 : node.depth <= 1 ? 600 : 500,
                        letterSpacing: '0.02em',
                        flex: 1,
                      }}
                    >
                      {node.name}
                    </span>

                    {node.hasChildren && (
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ml-2"
                        style={{
                          backgroundColor: node.isExpanded
                            ? 'rgba(255,255,255,0.14)'
                            : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <motion.svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          initial={false}
                          animate={{ rotate: node.isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.35, ease: EASE_SMOOTH }}
                        >
                          <path
                            d="M 2 1 L 5 4 L 2 7"
                            stroke="rgba(255,255,255,0.65)"
                            fill="none"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
