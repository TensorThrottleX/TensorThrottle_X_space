'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { SYSTEM_QUOTES } from '@/lib/dashboard-data'

interface QuoteCardProps {
  isBright: boolean
}

type Phase = 'INIT' | 'TYPING' | 'PAUSE' | 'DELETING' | 'NEXT'

const CHAR_DELAY = 30
const PUNCTUATION_EXTRA = 180
const DELETE_DELAY = 18
const PAUSE_MIN = 3500
const PAUSE_MAX = 5000
const NEXT_DELAY = 400

interface QuoteData {
  text: string
  author?: string
}

const FALLBACK: QuoteData = { text: 'No quotes available.', author: '' }

export function QuoteCard({ isBright }: QuoteCardProps) {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [phase, setPhase] = useState<Phase>('INIT')

  const alive = useRef(true)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIdx = useRef(-1)
  const quote = useRef<QuoteData>(FALLBACK)

  const clearTimer = useCallback(() => {
    if (timeout.current !== null) {
      clearTimeout(timeout.current)
      timeout.current = null
    }
  }, [])

  const pickQuote = useCallback(() => {
    if (SYSTEM_QUOTES.length === 0) return FALLBACK
    let idx = Math.floor(Math.random() * SYSTEM_QUOTES.length)
    while (idx === lastIdx.current && SYSTEM_QUOTES.length > 1) {
      idx = Math.floor(Math.random() * SYSTEM_QUOTES.length)
    }
    lastIdx.current = idx
    quote.current = SYSTEM_QUOTES[idx]
  }, [])

  useEffect(() => {
    alive.current = true
    clearTimer()

    function typeChar(pos: number) {
      if (!alive.current) return
      const q = quote.current
      setText(q.text.slice(0, pos))
      if (pos >= q.text.length) {
        setAuthor(q.author || '')
        setPhase('PAUSE')
        timeout.current = setTimeout(() => deleteChar(q.text.length), PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN))
        return
      }
      const ch = q.text[pos]
      const delay = '.!?,:;'.includes(ch) ? CHAR_DELAY + PUNCTUATION_EXTRA : CHAR_DELAY
      timeout.current = setTimeout(() => typeChar(pos + 1), delay)
    }

    function deleteChar(pos: number) {
      if (!alive.current) return
      const q = quote.current
      setText(q.text.slice(0, pos))
      if (pos <= 0) {
        setAuthor('')
        setPhase('NEXT')
        timeout.current = setTimeout(() => {
          if (!alive.current) return
          pickQuote()
          setPhase('TYPING')
          timeout.current = setTimeout(() => typeChar(0), NEXT_DELAY)
        }, NEXT_DELAY)
        return
      }
      timeout.current = setTimeout(() => deleteChar(pos - 1), DELETE_DELAY)
    }

    pickQuote()
    setPhase('TYPING')
    timeout.current = setTimeout(() => typeChar(0), 400)

    return () => {
      alive.current = false
      clearTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="primary-card relative perspective-1000 group items-center bg-transparent border-none shadow-none p-0 h-[33.75rem] cursor-default select-none pointer-events-none"
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
        <div className="w-full h-full px-[5rem] py-[4rem] flex flex-col justify-between relative"
          style={{ backgroundColor: 'var(--adaptive-glass-bg)' }}
        >
          {!isBright && (
            <>
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none rounded-[24px]" />
              <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-[24px]" />
            </>
          )}

          <div className="relative z-10 flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.8)] transition-colors duration-300",
              phase === 'TYPING' ? "bg-white animate-pulse" : "bg-cyan-400"
            )} />
            <span className="text-sm font-bold tracking-tight uppercase"
              style={{ color: 'var(--adaptive-hero-secondary)' }}
            >
              SYSTEM MEMORY
            </span>
          </div>

          <div className="relative z-10 flex flex-col gap-6 mt-8 max-w-2xl">
            <h2 className="text-[3.45rem] font-black tracking-tighter leading-[1.1] transition-colors duration-300"
              style={{ color: 'var(--adaptive-hero-color)' }}
            >
              &ldquo;{text}&rdquo;
              {(phase === 'TYPING' || phase === 'INIT' || phase === 'DELETING') && (
                <span className="inline-block w-[3px] h-[3.2rem] align-middle ml-1 rounded-sm animate-pulse"
                  style={{ backgroundColor: 'var(--adaptive-hero-color)', opacity: 0.6 }}
                />
              )}
            </h2>
          </div>

          <div className="relative z-10 w-full my-auto">
            <div className="w-full h-px"
              style={{ backgroundColor: 'var(--adaptive-hero-color)', opacity: 0.1 }}
            />
          </div>

          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex flex-col min-h-[1.25rem]">
              {author && (
                <span className="text-xs font-bold font-mono tracking-normal uppercase"
                  style={{ color: 'var(--adaptive-hero-muted)' }}
                >
                  — {author}
                </span>
              )}
            </div>
            <span className="text-xs font-bold font-mono tracking-normal"
              style={{ color: 'var(--adaptive-hero-secondary)' }}
            >
              ACTIVE_QUOTE
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 w-full flex justify-center pointer-events-none">
        <span className="text-xs font-black font-mono tracking-tighter uppercase animate-pulse"
          style={{ color: 'var(--adaptive-hero-muted)' }}
        >
          {phase === 'INIT' || phase === 'DELETING' || phase === 'NEXT' ? 'OBSERVING...' : phase === 'TYPING' ? 'THINKING...' : 'EXPRESSING...'}
        </span>
      </div>
    </div>
  )
}
