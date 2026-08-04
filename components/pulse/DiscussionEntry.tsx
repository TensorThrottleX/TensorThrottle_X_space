'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import { useDiscussion } from '@/components/providers/DiscussionProvider'
import { MessageCenterPanel } from './MessageCenterPanel'
import { MessageActivity } from './MessageCard'

// Quick local storage wrapper for message read state
const msgReadStore = {
  getReadIds: (): Set<string> => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = window.localStorage.getItem('ttx:messages:read')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  },
  saveReadIds: (ids: Set<string>) => {
    try {
      window.localStorage.setItem('ttx:messages:read', JSON.stringify(Array.from(ids)))
    } catch {}
  }
}

export function DiscussionEntry({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const pathname = usePathname()
  const { renderMode, isBooting } = useUI()
  const { openThread, messages, fetchMessages } = useDiscussion()
  const isBright = renderMode === 'bright'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => msgReadStore.getReadIds())
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  
  const btnRef = useRef<HTMLButtonElement>(null)

  const isFeedPage = pathname === '/feed'

  const measureAnchor = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 12, right: window.innerWidth - rect.right })
  }, [])

  const loadMessages = useCallback(async (force: boolean) => {
    if (force || !messages) {
      setLoading(true)
      await fetchMessages()
      setLoading(false)
    }
  }, [messages, fetchMessages])

  const openPanel = useCallback(() => {
    setOpen(true)
    measureAnchor()
    if (messages === null && !loading) {
      loadMessages(false)
    }
  }, [messages, loading, measureAnchor, loadMessages])

  const closePanel = useCallback(() => {
    setOpen(false)
    setTimeout(() => btnRef.current?.focus(), 50)
  }, [])

  const togglePanel = useCallback(() => {
    if (open) closePanel()
    else openPanel()
  }, [open, openPanel, closePanel])

  // Escape closes; click-outside closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closePanel()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      const portal = document.getElementById('message-center-portal')
      if (portal?.contains(target)) return
      closePanel()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer, { passive: true })
    window.addEventListener('resize', measureAnchor)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('resize', measureAnchor)
    }
  }, [open, closePanel, measureAnchor])

  const handleMessageClick = useCallback(
    (message: MessageActivity) => {
      const next = new Set(readIds)
      next.add(message.id)
      msgReadStore.saveReadIds(next)
      setReadIds(next)
      setOpen(false)

      // Open the discussion panel with just enough metadata
      openThread({
        slug: message.post_slug,
        title: message.post_title,
        // Since we don't have the full post, we just provide what DiscussionPanel needs to fetch/display comments.
      } as any)
    },
    [readIds, openThread],
  )

  const handleMarkAllRead = useCallback(() => {
    if (!messages || messages.length === 0) return
    const ids = messages.map((m) => m.id)
    const next = new Set([...readIds, ...ids])
    msgReadStore.saveReadIds(next)
    setReadIds(next)
  }, [messages, readIds])

  const handleRefresh = useCallback(() => {
    loadMessages(true)
  }, [loadMessages])

  if (isBooting || !isFeedPage) return null

  const dim = isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
  const accent = '#06b6d4' // cyan-500
  const hoverAccent = isBright ? '#0891b2' : '#22d3ee'

  const unreadCount = messages ? messages.filter(m => !readIds.has(m.id)).length : 0

  const button = (
    <motion.button
      ref={btnRef}
      type="button"
      onClick={togglePanel}
      title="Messages"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ 
        scale: 1.05, 
        y: -1,
        borderColor: hoverAccent,
        boxShadow: `0 4px 12px ${isBright ? 'rgba(8,145,178,0.15)' : 'rgba(34,211,238,0.15)'}`
      }}
      className="relative flex items-center justify-center rounded-2xl border px-3.5 py-2.5 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--adaptive-glass-bg)',
        borderColor: 'var(--adaptive-glass-border)',
        boxShadow: 'var(--adaptive-glass-shadow)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        pointerEvents: 'auto',
      }}
    >
      <div className="flex items-center gap-2">
        <MessageSquare size={15} style={{ color: dim }} className="transition-colors duration-200" />
      </div>
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
      )}
    </motion.button>
  )

  return (
    <>
      {variant === 'mobile' ? (
        <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[4.5rem] z-[300]">
          {button}
        </div>
      ) : (
        button
      )}

      <MessageCenterPanel
        open={open}
        isMobile={variant === 'mobile'}
        anchorTop={anchor?.top}
        anchorRight={anchor?.right}
        accent={accent}
        messages={messages}
        loading={loading}
        readIds={readIds}
        onClose={closePanel}
        onMessageClick={handleMessageClick}
        onMarkAllRead={handleMarkAllRead}
        onRefresh={handleRefresh}
      />
    </>
  )
}
