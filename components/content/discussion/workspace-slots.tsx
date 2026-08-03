'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Smile,
} from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'

// ─────────────────────────────────────────────────────────────────────────────
// Workspace extension slots.
//
// Toolbar + AI summary are future-ready placeholders: they render as visibly
// disabled, read-only chips with a "coming soon" tooltip and never intercept
// interaction. The composer exposes exactly ONE enabled extension — emoji —
// with everything else (attachments, mentions, voice, AI, markdown shortcuts,
// code snippets, polls) deliberately absent.
// ─────────────────────────────────────────────────────────────────────────────

function useSlotTones() {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  return {
    isBright,
    border: isBright ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)',
    text: isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)',
  }
}

function SlotChip({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode
  label: string
  hint: string
}) {
  const { border, text } = useSlotTones()
  return (
    <span
      title={hint}
      aria-disabled="true"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 opacity-55 select-none"
      style={{ borderColor: border, color: text }}
    >
      {icon}
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </span>
  )
}

export function DiscussionToolbarSlots() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <SlotChip icon={<Search size={11} />} label="Search" hint="Semantic search — coming soon" />
      <SlotChip icon={<SlidersHorizontal size={11} />} label="Filters" hint="Conversation filters — coming soon" />
      <SlotChip icon={<ArrowUpDown size={11} />} label="Sort" hint="Sort options — coming soon" />
    </div>
  )
}

export function DiscussionSummarySlot() {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const text = isBright ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'
  const accent = 'rgba(34,211,238,0.55)'

  return (
    <div
      aria-hidden="true"
      className="flex select-none items-center gap-1.5 text-[10px] font-semibold tracking-wide"
      style={{ color: text }}
    >
      <Sparkles size={12} style={{ color: accent }} />
      AI summary — Coming Soon
    </div>
  )
}

const EMOJI_SET = [
  '😀', '😄', '😁', '😆', '😂', '🤣',
  '😊', '😍', '😎', '🤔', '😭', '😴',
  '🙌', '👍', '👏', '🔥', '❤️', '💯',
  '🎉', '🚀', '✨', '👀', '🥳', '🤝',
]

export function ComposerExtensionSlots({
  onEmojiPick,
}: {
  onEmojiPick?: (emoji: string) => void
}) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [open, setOpen] = useState(false)
  const text = isBright ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)'
  const hoverBg = isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.09)'

  return (
    <div className="relative flex items-center select-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute bottom-full left-0 z-10 mb-2 rounded-2xl border p-3 shadow-xl"
            style={{
              backgroundColor: isBright ? 'rgba(250,249,246,0.98)' : 'rgba(18,18,18,0.98)',
              borderColor: isBright ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
            }}
          >
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_SET.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onEmojiPick?.(emoji)
                    setOpen(false)
                  }}
                  aria-label={`Insert ${emoji}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Add emoji"
        aria-expanded={open}
        title="Emoji"
        className="flex items-center justify-center rounded-full p-1.5 transition-colors"
        style={{ color: text }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Smile size={15} />
      </button>
    </div>
  )
}
