'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NarrativeEntry {
  title: string
  text: string
}

export const ABOUT_NARRATIVES: NarrativeEntry[] = [
  {
    title: 'ABOUT_01',
    text: 'I built this space because I wanted one place where every idea could live.\n\nNot just the finished projects, but the rough sketches, failed attempts, and questions that kept pulling me back.\n\nThis isn\'t a portfolio.\n\nIt\'s a record of how I think.',
  },
  {
    title: 'ABOUT_02',
    text: 'Most people only see the final result.\n\nI wanted to keep everything that came before it—the mistakes, experiments, redesigns, and late-night ideas that quietly shaped the outcome.\n\nThat\'s what this place is for.',
  },
  {
    title: 'ABOUT_03',
    text: 'Every project changes the way I think.\n\nEvery experiment leaves behind another question.\n\nThis space is simply where those questions continue to grow.',
  },
  {
    title: 'ABOUT_04',
    text: 'I built TensorThrottleX to remember how I got here.\n\nNot just what I made—\n\nbut what made me keep building.',
  },
]

// Global cache to persist slide index between component unmounts (e.g. tab switches)
let cachedNarrativeIndex = 0;

interface RotatingNarrativeProps {
  isBright: boolean
  onInitialize?: () => void
}

export function RotatingNarrative({ isBright }: RotatingNarrativeProps) {
  const [index, setIndex] = useState(cachedNarrativeIndex)
  const [direction, setDirection] = useState(1) // 1 for right (next), -1 for left (prev)

  const handleNext = useCallback(() => {
    setDirection(1)
    const newIdx = (index + 1) % ABOUT_NARRATIVES.length
    setIndex(newIdx)
    cachedNarrativeIndex = newIdx
  }, [index])

  const handlePrev = useCallback(() => {
    setDirection(-1)
    const newIdx = (index - 1 + ABOUT_NARRATIVES.length) % ABOUT_NARRATIVES.length
    setIndex(newIdx)
    cachedNarrativeIndex = newIdx
  }, [index])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return

      if (e.key === 'ArrowRight') handleNext()
      else if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  // Swipe navigation
  const touchStartX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const dx = touchStartX.current - touchEndX
    if (dx > 40) handleNext() // Swipe left
    else if (dx < -40) handlePrev() // Swipe right
  }

  const entry = ABOUT_NARRATIVES[index]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
    }),
  }

  return (
    <div 
      className={cn(
        'primary-card relative perspective-1000 group block bg-transparent border-none shadow-none p-0 h-[33.75rem]',
      )}
      onClick={handleNext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="w-full h-full rounded-[26px] overflow-hidden transition-all duration-500 relative border-[1.5px] border-b-[4px] border-r-[2px]"
        style={{
          backgroundColor: 'var(--adaptive-glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'var(--adaptive-glass-border)',
          borderBottomColor: 'color-mix(in srgb, var(--adaptive-hero-color) 15%, transparent)',
          borderRightColor: 'color-mix(in srgb, var(--adaptive-hero-color) 10%, transparent)',
          boxShadow: 'var(--shadow-premium)',
          transformOrigin: 'top center',
        }}
      >
        <div
          className="w-full h-full px-[5rem] py-[4rem] flex flex-col justify-between relative"
          style={{ backgroundColor: 'var(--adaptive-glass-bg)' }}
        >
          {!isBright && (
            <>
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none rounded-[24px]" />
              <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-[24px]" />
            </>
          )}

          {/* Top metadata */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            <span
              className="text-sm font-bold tracking-tight uppercase transition-colors duration-300"
              style={{ color: 'var(--adaptive-hero-secondary)' }}
            >
              ABOUT_{String(index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Sliding narrative text */}
          <div className="relative z-10 flex-1 w-full flex items-center justify-center max-w-2xl mx-auto overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="sync">
              <motion.div
                key={index}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ 
                  duration: 0.45, 
                  ease: [0.22, 1, 0.36, 1], // Smooth cubic-bezier
                }}
                className="absolute w-full"
              >
                <p
                  className="text-lg leading-relaxed whitespace-pre-line text-center select-none"
                  style={{ color: 'var(--adaptive-hero-color)' }}
                >
                  {entry.text}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom dots indicator (animated width) */}
          <div className="relative z-10 w-full flex justify-center gap-2 items-center h-4 mt-4">
            {ABOUT_NARRATIVES.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: i === index ? '28px' : '6px',
                  backgroundColor: i === index ? 'var(--adaptive-hero-color)' : 'var(--adaptive-glass-border)',
                  opacity: i === index ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 w-full flex justify-center pointer-events-none">
        <span
          className={cn(
            "text-xs font-black font-mono tracking-tighter uppercase animate-pulse",
            isBright ? "text-black opacity-70" : "text-white/40"
          )}
        >
          CLICK_TO_SEE
        </span>
      </div>
    </div>
  )
}
