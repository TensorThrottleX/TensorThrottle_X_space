'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Eye, MessageSquare, Users, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Comment, Post } from '@/types/post'
import { useUI } from '@/components/providers/UIProvider'
import { useIsMobile } from '@/hooks/use-mobile'
import { getBrowserFingerprint } from '@/lib/fingerprint'
import { formatDate } from '@/lib/utils'
import { SharedComposer, type SharedComposerHandle } from './discussion/composer'
import { ThreadedDiscussion } from './discussion/ThreadedDiscussion'
import {
  DiscussionToolbarSlots,
  DiscussionSummarySlot,
  ComposerExtensionSlots,
} from './discussion/workspace-slots'
import { formatCompactCount } from '@/lib/view-count'
import { recordSessionView } from '@/lib/view-tracking'
const SPRING = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 } as const
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

interface DiscussionPanelProps {
  postSlug: string
  postTitle: string
  open: boolean
  onClose: () => void
  onCommentAdded?: (comment: Comment) => void
  /** Fires with the fresh server count after a view is successfully recorded. */
  onViewRecorded?: (viewCount: number) => void
  /** Optional rich metadata (category, date, views...) for the sticky header. */
  post?: Post
  focusedCommentId?: string
}

function StatItem({
  icon,
  label,
  value,
  isBright,
  title,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isBright: boolean
  title?: string
}) {
  const dim = isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'
  const dimmer = isBright ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.28)'
  return (
    <div className="flex flex-col gap-0.5 min-w-0" title={title}>
      <div className="flex items-center gap-1.5" style={{ color: dim }}>
        {icon}
        <span className="text-[11px] font-semibold tabular-nums">{value}</span>
      </div>
      <span
        className="text-[8.5px] font-mono font-semibold uppercase tracking-[0.14em] truncate"
        style={{ color: dimmer }}
      >
        {label}
      </span>
    </div>
  )
}

/**
 * DiscussionPanel — the Discussion Workspace for a transmission.
 *
 * Desktop (≥1024px): a right-side workspace slides into the unused space next
 * to the feed. The feed stays visible and interactive; nothing scrolls away.
 * Esc or the close button dismisses it.
 *
 * Mobile (<1024px): a full-screen overlay that behaves like navigating into a
 * dedicated discussion screen — back arrow, swipe-back, browser back button.
 *
 * The threaded engine, moderation pipeline, optimistic updates and composer
 * are reused unchanged.
 */
export function DiscussionPanel({ postSlug, postTitle, open, onClose, onCommentAdded, onViewRecorded, post, focusedCommentId }: DiscussionPanelProps) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  const [mounted, setMounted] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [fingerprint, setFingerprint] = useState('')
  // Real server-side count — refreshed on open and after a recorded view
  const [viewCount, setViewCount] = useState(post?.viewCount ?? 0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const composerRef = useRef<SharedComposerHandle>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const mountedRef = useRef(true)
  const onCloseRef = useRef(onClose)
  const onViewRecordedRef = useRef(onViewRecorded)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    onViewRecordedRef.current = onViewRecorded
  }, [onViewRecorded])

  useEffect(() => {
    mountedRef.current = true
    setMounted(true)
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Genuine open: load comments + the post's real view count, then record
  // this session's view (session-deduped client-side; daily-unique server-side).
  useEffect(() => {
    if (!open) return
    setComments([])
    setNewCommentIds(new Set())
    setIsLoading(true)
    let cancelled = false

    const run = async () => {
      try {
        const [commentsData, fp] = await Promise.all([
          fetch(`/api/comments?slug=${encodeURIComponent(postSlug)}`).then((r) => r.json()),
          getBrowserFingerprint().catch(() => ''),
        ])
        if (cancelled || !mountedRef.current) return
        if (fp) setFingerprint(fp)
        setComments(commentsData.comments || [])
        if (typeof commentsData.viewCount === 'number') setViewCount(commentsData.viewCount)

        // Record ONLY on a genuine open this session (never on feed render)
        if (fp && recordSessionView(postSlug)) {
          try {
            const res = await fetch('/api/views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postSlug, visitorKey: fp }),
            })
            const data = await res.json()
            if (cancelled || !mountedRef.current) return
            if (typeof data.viewCount === 'number') {
              setViewCount(data.viewCount)
              onViewRecordedRef.current?.(data.viewCount)
            }
          } catch {
            // Recording failed — keep the last known count (graceful)
          }
        }
      } catch {
        // Load failed — empty thread state, no crash
      } finally {
        if (!cancelled && mountedRef.current) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [open, postSlug])

  // Desktop: Esc closes; initial focus lands on the close button.
  useEffect(() => {
    if (!open || isMobile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(focusTimer)
    }
  }, [open, isMobile])

  // Mobile: focus trap, body scroll lock, and browser-back-to-close.
  useEffect(() => {
    if (!open || !isMobile) return
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !dialog.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.history.pushState({ txDiscussion: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
      document.body.style.overflow = prevOverflow
      clearTimeout(focusTimer)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, isMobile])

  const handleCommentAdded = useCallback(
    (c: Comment) => {
      setNewCommentIds((prev) => new Set(prev).add(c.id))
      setComments((prev) => [c, ...prev])
      onCommentAdded?.(c)
    },
    [onCommentAdded],
  )

  const handleCommentUpdated = useCallback((c: Comment) => {
    setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)))
  }, [])

  const handleCommentDeleted = useCallback((c: Comment) => {
    setComments((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, deleted_at: new Date().toISOString(), message: '' } : x,
      ),
    )
  }, [])

  const author = post?.author?.trim() || 'TensorThrottleX'

  const participants = useMemo(() => {
    const names = new Set<string>()
    for (const c of comments) {
      if (!c.deleted_at) names.add(c.name.trim().toLowerCase())
    }
    return names.size
  }, [comments])

  const lastActivity = useMemo(() => {
    if (comments.length === 0) return null
    let max = 0
    for (const c of comments) max = Math.max(max, new Date(c.created_at).getTime())
    return new Date(max)
  }, [comments])

  const divider = isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'
  const dim = isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'
  const dimmer = isBright ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.28)'

  const panelStyle: React.CSSProperties = {
    backgroundColor: isBright ? 'rgba(250,249,246,0.97)' : 'rgba(10,10,10,0.97)',
    borderLeft: isMobile ? 'none' : `1px solid ${divider}`,
    boxShadow: isMobile
      ? 'none'
      : isBright
        ? '-24px 0 64px rgba(0,0,0,0.14)'
        : '-24px 0 64px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
    willChange: 'transform',
  }
  if (!isMobile) {
    panelStyle.width = 'min(38vw, 640px)'
    panelStyle.minWidth = 380
  }

  if (!mounted) return null

  const enterExit = reducedMotion ? { opacity: 0 } : { x: '100%' }
  const transition = reducedMotion ? { duration: 0.2, ease: 'easeOut' as const } : SPRING

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal={isMobile}
          aria-label={`Discussion — ${postTitle}`}
          className={
            isMobile
              ? 'fixed inset-0 z-[210] flex flex-col overflow-hidden'
              : 'fixed top-0 right-0 bottom-0 z-[210] flex flex-col overflow-hidden'
          }
          style={panelStyle}
          initial={enterExit}
          animate={{ x: 0, opacity: 1 }}
          exit={enterExit}
          transition={transition}
          drag={isMobile && !reducedMotion ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.5 }}
          dragDirectionLock
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x > 90 || info.velocity.x > 600) onCloseRef.current()
          }}
        >
          <div className="flex h-full w-full flex-col">
            {/* Sticky header — remains visible while scrolling */}
            <header
              className="shrink-0 px-5 lg:px-7 pt-[max(0.75rem,env(safe-area-inset-top))] lg:pt-5 pb-4"
              style={{
                borderBottom: `1px solid ${divider}`,
                backgroundColor: isBright ? 'rgba(250,249,246,0.88)' : 'rgba(10,10,10,0.88)',
                backdropFilter: 'blur(14px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                    <button
                      ref={closeBtnRef}
                      onClick={() => onCloseRef.current()}
                      aria-label="Close discussion"
                      className="p-1 -ml-1 rounded-full transition-colors shrink-0"
                      style={{ color: dim }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <X size={16} />
                    </button>
                    <span style={{ color: dim }}>Discussion</span>
                    {post?.category && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-normal"
                        style={{
                          backgroundColor: 'var(--secondary)',
                          color: 'var(--primary-foreground)',
                        }}
                      >
                        {post.category}
                      </span>
                    )}
                    {!isLoading && comments.length > 0 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px]"
                        style={{
                          backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
                          color: isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {comments.length}
                      </span>
                    )}
                  </div>
                  <h3
                    className="mt-2 text-sm lg:text-base font-semibold leading-snug line-clamp-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {postTitle}
                  </h3>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] shrink-0">
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-[7px] font-bold"
                        style={{
                          backgroundColor: isBright ? '#F5F5F4' : '#0b0b0b',
                          color: isBright ? '#000' : '#fff',
                        }}
                      >
                        TX
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                      {author}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: dimmer }}>
                      {post?.publishedAt ? formatDate(post.publishedAt) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discussion stats */}
              <div className="mt-3.5 grid grid-cols-2 min-[440px]:grid-cols-4 gap-x-4 gap-y-2.5">
                <StatItem icon={<Eye size={12} />} label="Views" value={formatCompactCount(viewCount)} isBright={isBright} title="Discussion views — daily-unique per visitor" />
                <StatItem icon={<MessageSquare size={12} />} label="Replies" value={String(comments.length)} isBright={isBright} />
                <StatItem icon={<Users size={12} />} label="Participants" value={String(participants)} isBright={isBright} />
                <StatItem
                  icon={<Clock size={12} />}
                  label="Last activity"
                  value={lastActivity ? formatDistanceToNow(lastActivity, { addSuffix: true }) : '—'}
                  isBright={isBright}
                />
              </div>
            </header>

            {/* Future slots: search / filters / sort */}
            <div className="shrink-0 px-5 lg:px-7 py-2.5" style={{ borderBottom: `1px solid ${divider}` }}>
              <DiscussionToolbarSlots />
            </div>

            {/* Thread tree — independent scroll container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto premium-scrollbar overscroll-contain touch-pan-y"
              style={{ padding: '16px 20px 12px' }}
            >
              {isLoading ? (
                <div className="space-y-8 py-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div
                        className="rounded-full shrink-0"
                        style={{
                          width: i === 0 ? 36 : 26,
                          height: i === 0 ? 36 : 26,
                          backgroundColor: isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
                        }}
                      />
                      <div className="flex-1 space-y-2 pt-1">
                        <div
                          className="h-2.5 rounded-full"
                          style={{ width: i === 0 ? '28%' : '20%', backgroundColor: isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)' }}
                        />
                        <div
                          className="h-2 rounded-full"
                          style={{ width: '85%', backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }}
                        />
                        <div
                          className="h-2 rounded-full"
                          style={{ width: '55%', backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <DiscussionSummarySlot />
                  </div>
                  <ThreadedDiscussion
                    postSlug={postSlug}
                    comments={comments}
                    fingerprint={fingerprint}
                    onCommentAdded={handleCommentAdded}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                    newCommentIds={newCommentIds}
                    focusedCommentId={focusedCommentId}
                    scrollRef={scrollRef}
                  />
                </>
              )}
            </div>

            {/* Sticky composer — remains fixed while scrolling */}
            <footer
              className="shrink-0 px-5 lg:px-7 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-4"
              style={{
                borderTop: `1px solid ${divider}`,
                backgroundColor: isBright ? 'rgba(250,249,246,0.7)' : 'rgba(8,8,8,0.7)',
              }}
            >
              <ComposerExtensionSlots onEmojiPick={(emoji) => composerRef.current?.insertText(emoji)} />
              <div className="mt-1.5">
                <SharedComposer
                  ref={composerRef}
                  postSlug={postSlug}
                  parentId={null}
                  fingerprint={fingerprint}
                  onSuccess={handleCommentAdded}
                  placeholder="Start a discussion..."
                />
              </div>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
