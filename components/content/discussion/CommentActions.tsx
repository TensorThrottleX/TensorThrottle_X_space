'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MoreHorizontal, Link2, Share2, Flag, Pencil, Trash2, Check, Loader2 } from 'lucide-react'
import type { Comment } from '@/types/post'
import { useUI } from '@/components/providers/UIProvider'
import { commentPermalink } from '@/lib/comment-link'
import { getCommentToken } from '@/lib/comment-tokens'

const EASE_SMOOTH: [number, number, number, number] = [0.16, 1, 0.3, 1]

type MenuItem = 'copy' | 'share' | 'report' | 'edit' | 'delete'

/**
 * Per-comment actions: like (optimistic), and a "more" menu with
 * copy link / share / report / edit / delete. Edit + delete are
 * capability-gated by the one-time token issued when the comment was created.
 */
export function CommentActions({
  comment,
  postSlug,
  fingerprint,
  onEditRequest,
  onDeleted,
  isBright,
  compact,
}: {
  comment: Comment
  postSlug: string
  fingerprint: string
  onEditRequest: () => void
  onDeleted: (comment: Comment) => void
  isBright: boolean
  compact?: boolean
}) {
  const [liked, setLiked] = useState(!!comment.liked_by_me)
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0)
  const [likeBusy, setLikeBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busyItem, setBusyItem] = useState<MenuItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const [transient, setTransient] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { renderMode } = useUI()

  const dim = isBright ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'
  const dimmer = isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'
  const editToken = getCommentToken(comment.id)

  // Close menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const flash = (label: string) => {
    setTransient(label)
    setTimeout(() => setTransient((cur) => (cur === label ? null : cur)), 1600)
  }

  // ─── Like (optimistic) ────────────────────────────────────────────────
  const toggleLike = useCallback(async () => {
    if (likeBusy || !fingerprint) return
    const prevLiked = liked
    const prevCount = likeCount
    setLiked(!prevLiked)
    setLikeCount(prevCount + (prevLiked ? -1 : 1))
    setLikeBusy(true)
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint }),
      })
      if (!res.ok) throw new Error('like failed')
      const data = await res.json()
      setLiked(!!data.liked)
      setLikeCount(data.like_count ?? prevCount)
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      setLikeBusy(false)
    }
  }, [likeBusy, liked, likeCount, fingerprint, comment.id])

  // ─── Copy link / Share ────────────────────────────────────────────────
  const copyLink = useCallback(async () => {
    setBusyItem('copy')
    try {
      await navigator.clipboard.writeText(commentPermalink(postSlug, comment.id))
      flash('Link copied')
    } catch {
      flash('Copy failed')
    } finally {
      setBusyItem(null)
    }
  }, [postSlug, comment.id])

  const share = useCallback(async () => {
    setBusyItem('share')
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Discussion comment',
          text: comment.message.slice(0, 120),
          url: commentPermalink(postSlug, comment.id),
        })
      } else {
        await navigator.clipboard.writeText(commentPermalink(postSlug, comment.id))
        flash('Link copied')
      }
    } catch {
      // user dismissed share sheet — not an error
    } finally {
      setBusyItem(null)
    }
  }, [postSlug, comment.id, comment.message])

  // ─── Report ───────────────────────────────────────────────────────────
  const submitReport = useCallback(async () => {
    if (!reportReason.trim() || reportDone) return
    setBusyItem('report')
    try {
      const res = await fetch(`/api/comments/${comment.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, reason: reportReason.trim() }),
      })
      if (!res.ok) throw new Error('report failed')
      setReportDone(true)
    } catch {
      flash('Report failed')
    } finally {
      setBusyItem(null)
    }
  }, [comment.id, fingerprint, reportReason, reportDone])

  // ─── Delete (two-step confirm) ────────────────────────────────────────
  const performDelete = useCallback(async () => {
    if (!editToken) return
    setBusyItem('delete')
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken }),
      })
      if (!res.ok) throw new Error('delete failed')
      onDeleted(comment)
      setMenuOpen(false)
    } catch {
      flash('Delete failed')
    } finally {
      setBusyItem(null)
      setConfirmDelete(false)
    }
  }, [comment, editToken, onDeleted])

  const menuBg = isBright ? 'rgba(255,255,255,0.96)' : 'rgba(18,18,18,0.96)'
  const menuBorder = isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'

  return (
    <div className="flex items-center gap-1" ref={menuRef}>
      {/* Like */}
      <button
        onClick={toggleLike}
        disabled={likeBusy}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike comment' : 'Like comment'}
        className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors hover:opacity-75 disabled:opacity-40"
        style={{ color: liked ? 'rgb(244,63,94)' : dim }}
      >
        <Heart size={compact ? 12 : 13} fill={liked ? 'rgb(244,63,94)' : 'none'} />
        {likeCount > 0 && <span className="text-[11px] font-medium tabular-nums">{likeCount}</span>}
      </button>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Comment actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="rounded-full p-1 transition-colors"
          style={{ color: dim }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent, rgb(34,211,238))' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = dim }}
        >
          <MoreHorizontal size={compact ? 13 : 14} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              aria-label="Comment actions"
              className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl overflow-hidden backdrop-blur-xl"
              style={{
                backgroundColor: menuBg,
                border: `1px solid ${menuBorder}`,
                boxShadow: isBright ? '0 12px 32px rgba(0,0,0,0.14)' : '0 12px 32px rgba(0,0,0,0.5)',
              }}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: EASE_SMOOTH }}
            >
              {/* Report form mode */}
              {reporting ? (
                <div className="p-3">
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                    Report this comment
                  </p>
                  {reportDone ? (
                    <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'rgb(34,197,94)' }}>
                      <Check size={13} /> Report submitted. Thank you.
                    </p>
                  ) : (
                    <>
                      <textarea
                        autoFocus
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        maxLength={200}
                        placeholder="Why is this comment problematic?"
                        rows={3}
                        className="w-full bg-transparent text-xs outline-none resize-none border rounded-lg p-2"
                        style={{
                          color: 'var(--foreground)',
                          borderColor: menuBorder,
                        }}
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          onClick={() => { setReporting(false); setReportReason(''); setReportDone(false) }}
                          className="text-[11px] hover:opacity-70"
                          style={{ color: dim }}
                        >
                          Back
                        </button>
                        <button
                          onClick={submitReport}
                          disabled={!reportReason.trim() || busyItem === 'report'}
                          className="text-[11px] font-semibold disabled:opacity-40"
                          style={{ color: 'rgb(239,68,68)' }}
                        >
                          {busyItem === 'report' ? 'Submitting…' : 'Submit report'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {confirmDelete ? (
                    <div className="p-3">
                      <p className="text-[11px] font-semibold mb-2" style={{ color: 'rgb(239,68,68)' }}>
                        Delete this comment?
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="text-[11px] hover:opacity-70"
                          style={{ color: dim }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={performDelete}
                          disabled={busyItem === 'delete'}
                          className="text-[11px] font-semibold disabled:opacity-40"
                          style={{ color: 'rgb(239,68,68)' }}
                        >
                          {busyItem === 'delete' ? 'Deleting…' : 'Yes, delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <MenuButton
                        label={transient === 'Link copied' ? 'Link copied' : 'Copy link'}
                        icon={transient === 'Link copied' ? <Check size={13} /> : <Link2 size={13} />}
                        onSelect={copyLink}
                        dim={dim}
                        busy={busyItem === 'copy'}
                      />
                      <MenuButton label="Share" icon={<Share2 size={13} />} onSelect={share} dim={dim} busy={busyItem === 'share'} />
                      <MenuButton label="Report" icon={<Flag size={13} />} onSelect={() => setReporting(true)} dim={dim} danger />
                      {editToken && (
                        <MenuButton
                          label="Edit"
                          icon={<Pencil size={13} />}
                          onSelect={() => { setMenuOpen(false); onEditRequest() }}
                          dim={dim}
                        />
                      )}
                      {editToken && (
                        <MenuButton
                          label="Delete"
                          icon={<Trash2 size={13} />}
                          onSelect={() => setConfirmDelete(true)}
                          dim={dim}
                          danger
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function MenuButton({
  label,
  icon,
  onSelect,
  dim,
  busy,
  danger,
}: {
  label: string
  icon: React.ReactNode
  onSelect: () => void
  dim: string
  busy?: boolean
  danger?: boolean
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  return (
    <button
      role="menuitem"
      onClick={onSelect}
      disabled={busy}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-50"
      style={{
        color: danger ? 'rgb(239,68,68)' : 'var(--foreground)',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  )
}
