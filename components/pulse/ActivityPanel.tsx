'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, RefreshCw } from 'lucide-react'
import type { Activity } from '@/types/activity'
import { buildGroupRows, computeUnreadCount } from '@/lib/activity/aggregate'
import { hexToRgba } from '@/lib/activity/colors'
import { useUI } from '@/components/providers/UIProvider'
import { ActivityCard } from './ActivityCard'

const PAGE_SIZE = 12

interface ActivityPanelProps {
  open: boolean
  isMobile: boolean
  /** Desktop anchor — below the bell. */
  anchorTop?: number
  anchorRight?: number
  accent: string
  /** null while the first load is in flight. */
  activities: Activity[] | null
  loading: boolean
  readIds: Set<string>
  onClose: () => void
  onActivityClick: (activity: Activity) => void
  onMarkAllRead: () => void
  onRefresh: () => void
}

export function ActivityPanel({
  open,
  isMobile,
  anchorTop,
  anchorRight,
  accent,
  activities,
  loading,
  readIds,
  onClose,
  onActivityClick,
  onMarkAllRead,
  onRefresh,
}: ActivityPanelProps) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE)

  useEffect(() => {
    if (open) setVisibleRows(PAGE_SIZE)
  }, [open])

  // Mobile: lock body scroll while the sheet is up
  useEffect(() => {
    if (!open || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  const rows = useMemo(
    () => (activities ? buildGroupRows(activities, readIds) : []),
    [activities, readIds],
  )
  const unreadCount = useMemo(
    () => (activities ? computeUnreadCount(activities, readIds) : 0),
    [activities, readIds],
  )
  const showRows = rows.slice(0, visibleRows)
  const hasMore = visibleRows < rows.length

  const divider = isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'
  const dim = isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'

  return createPortal(
    <>
      {/* Mobile scrim */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-[390] bg-black/50 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            id="pulse-panel-portal"
            role="dialog"
            aria-label="Pulse — activity center"
            className={
              isMobile
                ? 'fixed inset-x-0 bottom-0 z-[400] flex max-h-[75dvh] flex-col rounded-t-3xl border-t'
                : 'fixed z-[400] flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border'
            }
            style={{
              ...(isMobile
                ? {}
                : {
                    top: anchorTop ?? 0,
                    right: anchorRight ?? 16,
                    width: 'min(360px, calc(100vw - 2rem))',
                    maxHeight: anchorTop ? `min(70vh, calc(100dvh - ${anchorTop + 16}px))` : '70vh',
                  }),
              backgroundColor: 'var(--adaptive-glass-bg)',
              borderColor: 'var(--adaptive-glass-border)',
              boxShadow: 'var(--adaptive-glass-shadow), 0 24px 48px -16px rgba(0,0,0,0.45)',
              backdropFilter: 'blur(32px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
            }}
            initial={{ opacity: 0, y: isMobile ? 48 : -8, scale: isMobile ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 48 : -8, scale: isMobile ? 1 : 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="shrink-0 pt-2.5 pb-1">
                <div
                  className="mx-auto h-1 w-10 rounded-full"
                  style={{ backgroundColor: isBright ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)' }}
                />
              </div>
            )}

            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3.5 pb-3"
              style={{ borderBottom: `1px solid ${divider}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--heading-primary)' }}
                >
                  Pulse
                </span>
                {unreadCount > 0 && (
                  <span
                    className="rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: hexToRgba(accent, 0.15), color: accent }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="text-[9.5px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-70 disabled:opacity-30"
                style={{ color: accent }}
              >
                Mark all as read
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto premium-scrollbar overscroll-contain px-2 py-2">
              {activities === null && loading ? (
                <div className="space-y-2 px-2 py-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse py-1">
                      <div
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)' }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: '34%', backgroundColor: isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)' }}
                        />
                        <div
                          className="h-2.5 rounded-full"
                          style={{ width: '78%', backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed"
                    style={{ color: dim, borderColor: isBright ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.16)' }}
                  >
                    <Bell size={18} />
                  </span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    No activity yet
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: dim }}>
                    The ecosystem is quiet — check back soon.
                  </p>
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="mt-3.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-70"
                    style={{ color: accent }}
                  >
                    <RefreshCw size={11} />
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  {showRows.map((row, idx) =>
                    row.kind === 'header' ? (
                      <p
                        key={row.id}
                        className="px-3 pt-2.5 pb-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: dim }}
                      >
                        {row.label}
                      </p>
                    ) : (
                      <ActivityCard
                        key={row.activity.id}
                        activity={row.activity}
                        unread={row.unread}
                        index={idx}
                        onOpen={onActivityClick}
                      />
                    ),
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleRows((n) => n + PAGE_SIZE)}
                      className="mx-auto mt-1 mb-2 block rounded-full px-4 py-1.5 text-[9.5px] font-semibold uppercase tracking-wide transition-colors"
                      style={{
                        color: dim,
                        backgroundColor: isBright ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      Load more
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}
