'use client'

import React, { useState, useCallback, useMemo, createContext, useContext, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Check, MessageSquare, Sparkles } from 'lucide-react'
import type { Comment } from '@/types/post'
import { useUI } from '@/components/providers/UIProvider'
import { Avatar, SharedComposer } from './composer'
import { CommentActions } from './CommentActions'
import { getCommentToken } from '@/lib/comment-tokens'

export const INDENT = 26
/** Replies can nest indefinitely; only the first levels affect indentation. */
export const MAX_VISUAL_DEPTH = 8
/** Branches at or below this depth start folded — lazy mounting of deep trees. */
export const LAZY_DEPTH = 4
/** Replies revealed per "Show N more" click. */
export const SHOW_MORE_STEP = 5
/** Above this many *visible* rows, rendering switches to a windowed slice. */
const VIRTUAL_THRESHOLD = 80
/** Viewport overscan (px) rendered around the visible window. */
const VIRTUAL_BUFFER = 700

const EASE_SMOOTH: [number, number, number, number] = [0.16, 1, 0.3, 1]

export type CommentNode = {
  comment: Comment
  replies: CommentNode[]
  /** Total number of descendants (deep count) — drives reply counts. */
  descendantCount: number
}

export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>()
  const roots: CommentNode[] = []
  for (const c of comments) {
    nodeMap.set(c.id, { comment: c, replies: [], descendantCount: 0 })
  }
  for (const c of comments) {
    const node = nodeMap.get(c.id)
    if (!node) continue
    if (c.parent_id && nodeMap.has(c.parent_id)) {
      nodeMap.get(c.parent_id)!.replies.push(node)
    } else {
      roots.push(node)
    }
  }
  roots.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime())
  for (const node of nodeMap.values()) {
    node.replies.sort((a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime())
  }
  const count = (node: CommentNode): number => {
    let total = 0
    for (const reply of node.replies) {
      total += 1 + count(reply)
    }
    node.descendantCount = total
    return total
  }
  for (const root of roots) count(root)
  return roots
}

// ─── Thread state (collapse + lazy limits) — lifted so ancestors of new
// ─── replies can be expanded and counts stay consistent. ────────────────

interface ThreadState {
  collapsedIds: Set<string>
  toggleCollapsed: (id: string) => void
  childLimits: Map<string, number>
  showMoreReplies: (id: string) => void
}

const ThreadStateContext = createContext<ThreadState>({
  collapsedIds: new Set(),
  toggleCollapsed: () => {},
  childLimits: new Map(),
  showMoreReplies: () => {},
})

interface BranchHoverState {
  hoveredId: string | null
  setHoveredId: React.Dispatch<React.SetStateAction<string | null>>
}

const BranchHoverContext = createContext<BranchHoverState>({
  hoveredId: null,
  setHoveredId: () => {},
})

function lineColor(isBright: boolean, onPath: boolean) {
  return onPath
    ? (isBright ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)')
    : (isBright ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)')
}

/**
 * Branch guide lines for one row — thin 1px connectors with rounded joints.
 * Vertical levels draw first, then the elbow reaches the comment.
 * Lines on the hovered branch path brighten.
 */
function ConnectorLines({
  depth,
  isLast,
  isBright,
  onPath,
  delay,
}: {
  depth: number
  isLast: boolean
  isBright: boolean
  onPath: boolean
  delay: number
}) {
  if (depth === 0) return null
  const color = lineColor(isBright, onPath)
  const lines: React.ReactNode[] = []
  const visDepth = Math.min(depth, MAX_VISUAL_DEPTH)
  for (let d = 0; d < visDepth; d++) {
    const x = d * INDENT + 13
    const isDeep = d < visDepth - 1
    lines.push(
      <motion.div
        key={`v${d}`}
        className="absolute top-0 w-px rounded-full"
        style={{
          left: x,
          backgroundColor: color,
          bottom: isDeep || !isLast ? 0 : 14,
          transformOrigin: 'top',
          transition: 'background-color 0.3s ease',
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + d * 0.06, duration: 0.3, ease: EASE_SMOOTH }}
      />,
    )
    if (!isDeep) {
      lines.push(
        <motion.div
          key={`h${d}`}
          className="absolute top-[16px] h-px rounded-full"
          style={{
            left: x,
            width: INDENT,
            backgroundColor: color,
            transformOrigin: 'left',
            transition: 'background-color 0.3s ease',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + d * 0.06 + 0.12, duration: 0.25, ease: EASE_SMOOTH }}
        />,
      )
    }
  }
  return <div className="absolute inset-0 pointer-events-none">{lines}</div>
}

// ─── Flattening (windowed mode) ───────────────────────────────────────────

type FlatRow = {
  key: string
  node: CommentNode
  depth: number
  isLast: boolean
}

function flattenVisibleRows(
  roots: CommentNode[],
  collapsedIds: Set<string>,
  childLimits: Map<string, number>,
  out: FlatRow[] = [],
  depth = 0,
): FlatRow[] {
  for (const node of roots) {
    out.push({ key: node.comment.id, node, depth, isLast: false })
    if (depth >= 30) continue // pathological-depth guard
    if (!collapsedIds.has(node.comment.id)) {
      const limit = childLimits.get(node.comment.id) ?? SHOW_MORE_STEP
      const visible = node.replies.slice(0, Math.max(0, limit))
      if (visible.length > 0) {
        visible.forEach((reply, idx) => {
          flattenVisibleRows([reply], collapsedIds, childLimits, out, depth + 1)
          out[out.length - 1].isLast = idx === visible.length - 1
        })
      }
    }
  }
  return out
}

// ─── Row height estimation (windowed mode) ────────────────────────────────

function estimateRowHeight(row: FlatRow): number {
  const len = row.node.comment.message?.length || 0
  const lines = Math.max(1, Math.ceil(len / 52))
  const base = row.depth === 0 ? 64 : 56
  return base + lines * 20 + (row.depth === 0 ? 28 : 0) // root gap
}

function prefixSums(rows: FlatRow[]): Float64Array {
  const cum = new Float64Array(rows.length + 1)
  for (let i = 0; i < rows.length; i++) {
    cum[i + 1] = cum[i] + estimateRowHeight(rows[i])
  }
  return cum
}

/**
 * Returns the window of rows to render given the scroll position.
 * `scrollRef` — scroll container (DiscussionPanel); null → window viewport.
 */
function useWindowedRange(rows: FlatRow[], scrollRef?: React.RefObject<HTMLDivElement | null>) {
  const [range, setRange] = useState({ start: 0, end: Math.min(rows.length, 20) })
  const cumRef = useRef<Float64Array | null>(null)

  useEffect(() => {
    cumRef.current = prefixSums(rows)
    const update = () => {
      const el = scrollRef?.current
      const top = el ? el.scrollTop : window.scrollY
      const viewport = el ? el.clientHeight : window.innerHeight
      const cum = cumRef.current!
      const lo = Math.max(0, top - VIRTUAL_BUFFER)
      const hi = Math.min(cum[cum.length - 1], top + viewport + VIRTUAL_BUFFER)
      let start = 0
      let end = rows.length
      while (start < end && cum[start] < lo) start++
      while (end > start && cum[end] > hi) end--
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }
    update()
    const el = scrollRef?.current
    el?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [rows, scrollRef])

  return { range, cum: cumRef.current }
}

// ─── Comment row ──────────────────────────────────────────────────────────

function CommentRow({
  node,
  depth,
  isLast,
  siblingIndex,
  isNew,
  postSlug,
  fingerprint,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  parentMap,
  newCommentIds,
  flat,
}: {
  node: CommentNode
  depth: number
  isLast: boolean
  siblingIndex: number
  isNew: boolean
  postSlug: string
  fingerprint: string
  onCommentAdded: (comment: Comment) => void
  onCommentUpdated: (comment: Comment) => void
  onCommentDeleted: (comment: Comment) => void
  parentMap: Map<string, string | null>
  newCommentIds?: Set<string>
  /** Windowed mode — children render as separate sibling rows, not inlined. */
  flat?: boolean
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const { hoveredId, setHoveredId } = useContext(BranchHoverContext)
  const { collapsedIds, toggleCollapsed, childLimits, showMoreReplies } = useContext(ThreadStateContext)
  const [showReply, setShowReply] = useState(false)
  const [editing, setEditing] = useState(false)
  const { comment, replies, descendantCount } = node
  const hasReplies = replies.length > 0
  const isRoot = depth === 0
  const avatarSize = isRoot ? 36 : 26
  const collapsed = collapsedIds.has(comment.id)
  const childLimit = childLimits.get(comment.id) ?? SHOW_MORE_STEP
  const visibleChildren = flat ? [] : hasReplies && !collapsed ? replies.slice(0, Math.max(0, childLimit)) : []
  const remaining = hasReplies && !collapsed ? Math.max(0, replies.length - visibleChildren.length) : 0
  const visDepth = Math.min(depth, MAX_VISUAL_DEPTH)
  const isDeleted = !!comment.deleted_at
  const meta = comment.metadata as Record<string, unknown> | null | undefined
  const isVerified = !!meta?.is_verified || !!meta?.verified
  const isAi = !!meta?.is_ai || !!meta?.ai
  const editToken = isDeleted ? null : getCommentToken(comment.id)

  const isOnPath = useMemo(() => {
    if (!hoveredId) return false
    if (hoveredId === comment.id) return true
    let cur = parentMap.get(hoveredId)
    while (cur) {
      if (cur === comment.id) return true
      cur = parentMap.get(cur)
    }
    return false
  }, [hoveredId, comment.id, parentMap])

  const connectorDelay = 0.15 + depth * 0.08 + siblingIndex * 0.04
  const enterDelay = connectorDelay + 0.12

  return (
    <motion.div
      layout
      className={`relative ${flat && isRoot ? 'mb-7' : ''}`}
      initial={{ opacity: 0, y: isNew ? 6 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isNew ? 0.45 : 0.4,
        delay: isNew ? 0 : enterDelay,
        ease: EASE_SMOOTH,
      }}
      onMouseEnter={() => setHoveredId(comment.id)}
      onMouseLeave={() => setHoveredId((cur) => (cur === comment.id ? null : cur))}
    >
      <ConnectorLines depth={depth} isLast={isLast} isBright={isBright} onPath={isOnPath} delay={connectorDelay} />

      <div style={{ marginLeft: visDepth * INDENT }}>
        <div
          className={`flex gap-3 rounded-xl ${isRoot ? 'py-1' : 'py-0.5'}`}
          style={{ transition: 'background-color 0.3s ease', backgroundColor: isOnPath ? (isBright ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)') : 'transparent' }}
        >
          <Avatar name={comment.name} size={avatarSize} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-semibold leading-none"
                style={{
                  color: 'var(--foreground)',
                  fontSize: isRoot ? 14 : 12.5,
                }}
              >
                {comment.name}
              </span>
              {isVerified && (
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  title="Verified"
                  style={{
                    width: 13,
                    height: 13,
                    backgroundColor: 'rgba(34,211,238,0.15)',
                    color: 'rgb(34,211,238)',
                  }}
                >
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
              {isAi && (
                <span
                  className="flex items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide uppercase"
                  title="AI-generated"
                  style={{
                    backgroundColor: isBright ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.16)',
                    color: 'rgb(34,211,238)',
                  }}
                >
                  <Sparkles size={8} /> AI
                </span>
              )}
              <time
                className="text-[11px]"
                style={{ color: isBright ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)' }}
              >
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </time>
              {comment.edited_at && (
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)' }}
                  title={`Edited ${formatDistanceToNow(new Date(comment.edited_at), { addSuffix: true })}`}
                >
                  (edited)
                </span>
              )}
            </div>
            {editing && editToken ? (
              <div className="mt-1">
                <SharedComposer
                  key={`edit-${comment.id}`}
                  postSlug={postSlug}
                  parentId={comment.parent_id}
                  fingerprint={fingerprint}
                  mode="edit"
                  initialValue={comment.message}
                  editCommentId={comment.id}
                  editToken={editToken}
                  onEdit={onCommentUpdated}
                  onCancel={() => setEditing(false)}
                  cancelLabel="Cancel"
                  compact
                  autoFocus
                />
              </div>
            ) : isDeleted ? (
              <p
                className="mt-1 text-sm italic"
                style={{
                  color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.22)',
                }}
              >
                This comment was deleted.
              </p>
            ) : (
              <p
                className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{
                  color: isRoot ? 'var(--text-secondary)' : isBright ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.68)',
                  lineHeight: 1.55,
                }}
              >
                {comment.message}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1">
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-[11px] font-semibold tracking-wide uppercase transition-colors"
                style={{
                  color: showReply
                    ? 'var(--accent, rgb(34,211,238))'
                    : isBright ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent, rgb(34,211,238))' }}
                onMouseLeave={(e) => {
                  if (!showReply) e.currentTarget.style.color = isBright ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.3)'
                }}
              >
                {showReply ? 'Cancel' : 'Reply'}
              </button>
              {hasReplies && (
                <button
                  onClick={() => toggleCollapsed(comment.id)}
                  className="text-[11px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.22)' }}
                >
                  {collapsed
                    ? `${descendantCount} ${descendantCount === 1 ? 'reply' : 'replies'}`
                    : 'Hide replies'}
                </button>
              )}
              {!isDeleted && (
                <div className="ml-auto">
                  <CommentActions
                    comment={comment}
                    postSlug={postSlug}
                    fingerprint={fingerprint}
                    onEditRequest={() => setEditing(true)}
                    onDeleted={onCommentDeleted}
                    isBright={isBright}
                    compact={!isRoot}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline reply composer — branch stub grows, then the typing area fades in */}
        <AnimatePresence>
          {showReply && (
            <motion.div
              className="relative overflow-hidden mt-1"
              style={{ marginLeft: visDepth * INDENT }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
            >
              <motion.div
                className="absolute top-0 bottom-0 w-px rounded-full"
                style={{
                  left: 13,
                  backgroundColor: lineColor(isBright, isOnPath),
                  transformOrigin: 'top',
                  transition: 'background-color 0.3s ease',
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.08, duration: 0.3, ease: EASE_SMOOTH }}
              />
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.25, ease: EASE_SMOOTH }}
                className="pb-2"
                style={{ paddingLeft: 22 }}
              >
                <SharedComposer
                  postSlug={postSlug}
                  parentId={comment.id}
                  fingerprint={fingerprint}
                  onSuccess={onCommentAdded}
                  onCancel={() => setShowReply(false)}
                  cancelLabel="Cancel"
                  placeholder="Write a reply..."
                  autoFocus
                  compact
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies — grow as a branch, reflow smoothly on change */}
        {!flat && (
          <AnimatePresence initial={false}>
            {visibleChildren.length > 0 && (
              <motion.div
                key="replies"
                className="overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: EASE_SMOOTH }}
              >
                {visibleChildren.map((reply, idx) => (
                  <CommentRow
                    key={reply.comment.id}
                    node={reply}
                    depth={depth + 1}
                    isLast={idx === visibleChildren.length - 1}
                    siblingIndex={idx}
                    isNew={!!newCommentIds?.has(reply.comment.id)}
                    postSlug={postSlug}
                    fingerprint={fingerprint}
                    onCommentAdded={onCommentAdded}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                    parentMap={parentMap}
                    newCommentIds={newCommentIds}
                  />
                ))}
                {remaining > 0 && (
                  <motion.button
                    key="more"
                    className="text-[11px] font-semibold tracking-wide uppercase mt-1 transition-colors hover:opacity-70"
                    style={{
                      marginLeft: Math.min(depth + 1, MAX_VISUAL_DEPTH) * INDENT + 13,
                      color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.28)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    onClick={() => showMoreReplies(comment.id)}
                  >
                    Show {remaining} more {remaining === 1 ? 'reply' : 'replies'}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

const MemoizedCommentRow = React.memo(CommentRow)

// ─── ThreadedDiscussion ───────────────────────────────────────────────────

export function ThreadedDiscussion({
  postSlug,
  comments,
  fingerprint,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  topComposer,
  autoFocusTop,
  rootComposerPlaceholder,
  newCommentIds,
  scrollRef,
}: {
  postSlug: string
  comments: Comment[]
  fingerprint: string
  onCommentAdded: (comment: Comment) => void
  onCommentUpdated?: (comment: Comment) => void
  onCommentDeleted?: (comment: Comment) => void
  topComposer?: boolean
  autoFocusTop?: boolean
  rootComposerPlaceholder?: string
  newCommentIds?: Set<string>
  /** Scroll container for windowed mode (DiscussionPanel). Null → viewport. */
  scrollRef?: React.RefObject<HTMLDivElement | null>
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [childLimits, setChildLimits] = useState<Map<string, number>>(new Map())
  const autoCollapsedForRef = useRef<Comment[] | null>(null)
  const userToggledRef = useRef(false)
  const prevNewIdsRef = useRef<Set<string> | null>(null)

  const tree = useMemo(() => buildCommentTree(comments), [comments])
  const parentMap = useMemo(() => new Map(comments.map((c) => [c.id, c.parent_id])), [comments])

  // Lazy deep branches: fold any node sitting at/under LAZY_DEPTH on first load
  useEffect(() => {
    if (userToggledRef.current) return
    if (autoCollapsedForRef.current === comments) return
    autoCollapsedForRef.current = comments
    const deep = new Set<string>()
    const walk = (nodes: CommentNode[], depth: number) => {
      for (const node of nodes) {
        if (depth >= LAZY_DEPTH) deep.add(node.comment.id)
        walk(node.replies, depth + 1)
      }
    }
    walk(tree, 0)
    setCollapsedIds((cur) => {
      const next = new Set(cur)
      for (const id of deep) next.add(id)
      return next
    })
  }, [tree, comments])

  // Auto-expand ancestors + reveal the parent branch when a reply arrives
  useEffect(() => {
    if (!newCommentIds) return
    const prev = prevNewIdsRef.current
    prevNewIdsRef.current = newCommentIds
    if (!prev) return
    const added = [...newCommentIds].filter((id) => !prev.has(id))
    if (added.length === 0) return

    const expandChain: string[] = []
    for (const id of added) {
      let p = parentMap.get(id)
      while (p) {
        if (!expandChain.includes(p)) expandChain.push(p)
        p = parentMap.get(p)
      }
    }
    if (expandChain.length === 0) return

    setCollapsedIds((cur) => {
      const next = new Set(cur)
      for (const id of expandChain) next.delete(id)
      return next
    })
    setChildLimits((cur) => {
      const next = new Map(cur)
      for (const id of expandChain) next.set(id, Infinity)
      return next
    })
  }, [newCommentIds, parentMap])

  const toggleCollapsed = useCallback((id: string) => {
    userToggledRef.current = true
    setCollapsedIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const showMoreReplies = useCallback((id: string) => {
    setChildLimits((cur) => {
      const current = cur.get(id) ?? SHOW_MORE_STEP
      if (current >= 100_000) return cur
      const next = new Map(cur)
      next.set(id, current + SHOW_MORE_STEP)
      return next
    })
  }, [])

  const handleAdded = useCallback(
    (c: Comment) => {
      onCommentAdded(c)
    },
    [onCommentAdded],
  )

  const handleUpdated = useCallback(
    (c: Comment) => {
      onCommentUpdated?.(c)
    },
    [onCommentUpdated],
  )

  const handleDeleted = useCallback(
    (c: Comment) => {
      onCommentDeleted?.(c)
    },
    [onCommentDeleted],
  )

  const flatRows = useMemo(
    () => flattenVisibleRows(tree, collapsedIds, childLimits),
    [tree, collapsedIds, childLimits],
  )
  const windowed = flatRows.length > VIRTUAL_THRESHOLD
  const { range, cum } = useWindowedRange(windowed ? flatRows : [], scrollRef)
  const visibleSlice = windowed ? flatRows.slice(range.start, range.end) : flatRows
  const topPad = windowed && cum ? cum[range.start] ?? 0 : 0
  const bottomPad = windowed && cum ? (cum[cum.length - 1] ?? 0) - (cum[range.end] ?? 0) : 0

  return (
    <BranchHoverContext.Provider value={{ hoveredId, setHoveredId }}>
      <ThreadStateContext.Provider value={{ collapsedIds, toggleCollapsed, childLimits, showMoreReplies }}>
        {topComposer && (
          <div
            className="pb-4 mb-5"
            style={{ borderBottom: isBright ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            <SharedComposer
              postSlug={postSlug}
              parentId={null}
              fingerprint={fingerprint}
              onSuccess={handleAdded}
              placeholder={rootComposerPlaceholder ?? 'Share your thoughts...'}
              autoFocus={autoFocusTop}
            />
          </div>
        )}

        {tree.length === 0 ? (
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE_SMOOTH }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-dashed"
              style={{
                borderColor: isBright ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.16)',
                color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.32)',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <p
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}
            >
              Transmission received.
            </p>
            <p className="mt-3 text-sm font-semibold" style={{ color: isBright ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
              No responses yet.
            </p>
            <p className="mt-1 text-xs" style={{ color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.32)' }}>
              Start the first discussion — your signal is the spark.
            </p>
          </motion.div>
        ) : windowed ? (
          /* Windowed list — renders only the visible slice (huge threads) */
          <div className="relative pb-2">
            {topPad > 0 && <div aria-hidden style={{ height: topPad }} />}
            {visibleSlice.map((row) => (
              <MemoizedCommentRow
                key={row.key}
                node={row.node}
                depth={row.depth}
                isLast={row.isLast}
                siblingIndex={0}
                isNew={!!newCommentIds?.has(row.node.comment.id)}
                postSlug={postSlug}
                fingerprint={fingerprint}
                onCommentAdded={handleAdded}
                onCommentUpdated={handleUpdated}
                onCommentDeleted={handleDeleted}
                parentMap={parentMap}
                newCommentIds={newCommentIds}
                flat
              />
            ))}
            {bottomPad > 0 && <div aria-hidden style={{ height: bottomPad }} />}
          </div>
        ) : (
          /* Animated tree — full rendering below the virtualization threshold */
          <div className="pb-2">
            {tree.map((node, idx) => (
              <div key={node.comment.id} className={idx < tree.length - 1 ? 'mb-7' : ''}>
                <MemoizedCommentRow
                  node={node}
                  depth={0}
                  isLast={idx === tree.length - 1}
                  siblingIndex={idx}
                  isNew={!!newCommentIds?.has(node.comment.id)}
                  postSlug={postSlug}
                  fingerprint={fingerprint}
                  onCommentAdded={handleAdded}
                  onCommentUpdated={handleUpdated}
                  onCommentDeleted={handleDeleted}
                  parentMap={parentMap}
                  newCommentIds={newCommentIds}
                />
              </div>
            ))}
          </div>
        )}
      </ThreadStateContext.Provider>
    </BranchHoverContext.Provider>
  )
}
