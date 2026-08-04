'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Lightbulb,
  FolderKanban,
  FlaskConical,
  Network,
  Clapperboard,
  Music,
  Globe,
  Newspaper,
  Sparkles,
  LucideIcon
} from 'lucide-react'
import type { Activity } from '@/types/activity'
import { hexToRgba } from '@/lib/activity/colors'
import { useUI } from '@/components/providers/UIProvider'

const ICON_MAP: Record<string, LucideIcon> = {
  Lightbulb,
  FolderKanban,
  FlaskConical,
  Network,
  Clapperboard,
  Music,
  Globe,
  Newspaper,
  Sparkles
}

const PALETTE = ['#f59e0b', '#a78bfa', '#34d399', '#22d3ee', '#fb7185', '#c084fc', '#60a5fa']

function getAccent(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function ActivityCard({
  activity,
  unread,
  index,
  onOpen,
}: {
  activity: Activity
  unread: boolean
  index: number
  onOpen: (activity: Activity) => void
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  
  const Icon = ICON_MAP[activity.icon] || Sparkles

  const accent = getAccent(activity.source)
  const badge = activity.action === 'Updated' ? 'Updated' : 'New'
  const baseBg = unread
    ? (isBright ? 'rgba(34,211,238,0.06)' : 'rgba(34,211,238,0.08)')
    : 'transparent'
  const hoverBg = isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(activity)}
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
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: hexToRgba(accent, 0.13), color: accent }}
      >
        <Icon size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
            style={{ color: isBright ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)' }}
          >
            {activity.source}
          </span>
          <span
            className="rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide shrink-0"
            style={{ backgroundColor: hexToRgba(accent, 0.15), color: accent }}
          >
            {badge}
          </span>
          {unread && (
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
            />
          )}
          <span
            className="ml-auto text-[9.5px] shrink-0"
            style={{ color: isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)' }}
          >
            {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}
          </span>
        </div>

        <p
          className="mt-1 text-[11.5px] font-semibold leading-snug line-clamp-2 break-words"
          style={{ color: 'var(--foreground)' }}
        >
          {activity.title}
        </p>
        <p
          className="mt-0.5 text-[9.5px] font-medium"
          style={{ color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.26)' }}
        >
          {activity.action} · {activity.entityType}
        </p>
      </div>
    </motion.button>
  )
}
