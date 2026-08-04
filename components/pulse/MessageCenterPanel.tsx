'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { hexToRgba } from '@/lib/activity/colors'
import { useUI } from '@/components/providers/UIProvider'
import { MessageCard, MessageActivity } from './MessageCard'

const PAGE_SIZE = 12

interface MessageCenterPanelProps {
  open: boolean
  isMobile: boolean
  anchorTop?: number
  anchorRight?: number
  accent: string
  messages: MessageActivity[] | null
  loading: boolean
  readIds: Set<string>
  onClose: () => void
  onMessageClick: (message: MessageActivity) => void
  onMarkAllRead: () => void
  onRefresh: () => void
}

export function MessageCenterPanel({
  open,
  isMobile,
  anchorTop,
  anchorRight,
  accent,
  messages,
  loading,
  readIds,
  onClose,
  onMessageClick,
  onMarkAllRead,
  onRefresh,
}: MessageCenterPanelProps) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE)

  useEffect(() => {
    if (open) setVisibleRows(PAGE_SIZE)
  }, [open])

  useEffect(() => {
    if (!open || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  const unreadCount = useMemo(
    () => (messages ? messages.filter(m => !readIds.has(m.id)).length : 0),
    [messages, readIds],
  )
  const showRows = messages?.slice(0, visibleRows) || []
  const hasMore = messages ? visibleRows < messages.length : false

  const divider = isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'
  const dim = isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'

  return createPortal(
    <>
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
            id="message-center-portal"
            role="dialog"
            aria-label="Message Center"
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
            {isMobile && (
              <div className="shrink-0 pt-2.5 pb-1">
                <div
                  className="mx-auto h-1 w-10 rounded-full"
                  style={{ backgroundColor: isBright ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)' }}
                />
              </div>
            )}

            <div
              className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3.5 pb-3"
              style={{ borderBottom: `1px solid ${divider}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--heading-primary)' }}
                >
                  Messages
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

            <div className="flex-1 overflow-y-auto premium-scrollbar overscroll-contain px-2 py-2">
              {messages === null && loading ? (
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
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed"
                    style={{ color: dim, borderColor: isBright ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.16)' }}
                  >
                    <MessageSquare size={18} />
                  </span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    No recent messages.
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: dim }}>
                    When users reply to discussions, they will appear here.
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
                  {showRows.map((msg, idx) => (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      unread={!readIds.has(msg.id)}
                      index={idx}
                      onOpen={onMessageClick}
                    />
                  ))}
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
