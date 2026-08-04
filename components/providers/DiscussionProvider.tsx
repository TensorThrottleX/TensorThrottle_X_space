'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import type { Post } from '@/types/post'

import type { MessageActivity } from '@/components/pulse/MessageCard'

interface DiscussionContextValue {
  isOpen: boolean
  mode: 'global' | 'thread'
  selectedPost: Post | null
  focusedCommentId?: string
  unreadCount: number
  optimisticCounts: Record<string, number>
  messages: MessageActivity[] | null
  fetchMessages: () => Promise<void>
  openGlobal: () => void
  openThread: (post: Post, commentId?: string) => void
  closePanel: () => void
  updateCount: (slug: string, newCount: number) => void
  incrementCount: (slug: string) => void
  decrementCount: (slug: string) => void
  setUnreadCount: (count: number) => void
}

const DiscussionContext = createContext<DiscussionContextValue | null>(null)

export function DiscussionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'global' | 'thread'>('global')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [focusedCommentId, setFocusedCommentId] = useState<string | undefined>()
  const [unreadCount, setUnreadCount] = useState(0)
  const [optimisticCounts, setOptimisticCounts] = useState<Record<string, number>>({})
  const [messages, setMessages] = useState<MessageActivity[] | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/comments/recent')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.recent || [])
      }
    } catch (e) {
      console.error('Failed to fetch recent discussion messages', e)
    }
  }, [])

  const openGlobal = useCallback(() => {
    setMode('global')
    setSelectedPost(null)
    setFocusedCommentId(undefined)
    setIsOpen(true)
  }, [])

  const openThread = useCallback((post: Post, commentId?: string) => {
    setMode('thread')
    setSelectedPost(post)
    setFocusedCommentId(commentId)
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const updateCount = useCallback((slug: string, newCount: number) => {
    setOptimisticCounts((prev) => ({ ...prev, [slug]: newCount }))
  }, [])

  const incrementCount = useCallback((slug: string) => {
    setOptimisticCounts((prev) => ({
      ...prev,
      [slug]: (prev[slug] ?? 0) + 1,
    }))
  }, [])

  const decrementCount = useCallback((slug: string) => {
    setOptimisticCounts((prev) => ({
      ...prev,
      [slug]: Math.max(0, (prev[slug] ?? 0) - 1),
    }))
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      selectedPost,
      focusedCommentId,
      unreadCount,
      optimisticCounts,
      messages,
      fetchMessages,
      openGlobal,
      openThread,
      closePanel,
      updateCount,
      incrementCount,
      decrementCount,
      setUnreadCount,
    }),
    [isOpen, mode, selectedPost, focusedCommentId, unreadCount, optimisticCounts, messages, fetchMessages, openGlobal, openThread, closePanel, updateCount, incrementCount, decrementCount]
  )

  return <DiscussionContext.Provider value={value}>{children}</DiscussionContext.Provider>
}

export function useDiscussion() {
  const context = useContext(DiscussionContext)
  if (!context) {
    throw new Error('useDiscussion must be used within a DiscussionProvider')
  }
  return context
}
