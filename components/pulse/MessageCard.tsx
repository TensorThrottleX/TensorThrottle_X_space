'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, MessageCircle, User } from 'lucide-react'
import { hexToRgba } from '@/lib/activity/colors'
import { useUI } from '@/components/providers/UIProvider'

export interface MessageActivity {
  id: string
  post_slug: string
  post_title: string
  name: string
  created_at: string
}

export function MessageCard({
  message,
  unread,
  index,
  onOpen,
}: {
  message: MessageActivity
  unread: boolean
  index: number
  onOpen: (message: MessageActivity) => void
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  
  const accent = '#06b6d4' // cyan-500
  const baseBg = unread
    ? (isBright ? 'rgba(6,182,212,0.06)' : 'rgba(6,182,212,0.08)')
    : 'transparent'
  const hoverBg = isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(message)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
      className="w-full text-left flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
      style={{ backgroundColor: baseBg }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = baseBg
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: hexToRgba(accent, 0.13), color: accent }}
      >
        <User size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold tracking-wider shrink-0"
            style={{ color: 'var(--foreground)' }}
          >
            {message.name}
          </span>
          <span
            className="text-[9.5px] font-medium"
            style={{ color: isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)' }}
          >
            replied to
          </span>
          {unread && (
            <span
              className="ml-2 h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
            />
          )}
          <span
            className="ml-auto text-[9.5px] shrink-0"
            style={{ color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)' }}
          >
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        <p
          className="mt-1 text-[11.5px] font-semibold leading-snug line-clamp-1 truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {message.post_title}
        </p>
      </div>
    </motion.button>
  )
}
