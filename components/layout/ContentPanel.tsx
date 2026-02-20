'use client'

import { ReactNode } from 'react'
import { differenceInWeeks, isValid } from 'date-fns'

interface ContentPanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  latestPublishedAt?: string
  hideTitleOnMobile?: boolean
}

export function ContentPanel({ children, title, subtitle, latestPublishedAt, hideTitleOnMobile }: ContentPanelProps) {
  // Calculate status color based on recency
  const pubDate = latestPublishedAt ? new Date(latestPublishedAt) : null
  const isValidDate = pubDate && isValid(pubDate)
  const weeksDiff = isValidDate ? differenceInWeeks(new Date(), pubDate!) : Infinity
  const isPostActive = weeksDiff < 3

  const StatusIndicator = (
    <div className="mt-6 flex flex-wrap items-center gap-6 border-t pt-4 border-[var(--border)] opacity-80">
      {/* Primary Status: Frequency Recency */}
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${isValidDate && isPostActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500/50'}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Frequency: {isValidDate ? (isPostActive ? 'Active' : 'Idle') : 'Standby'}
        </span>
      </div>

      {/* Secondary Status: Live Engine / Connection */}
      <div className="flex items-center gap-2">
        <div className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Engine: Tracking
        </span>
      </div>

      {/* Tertiary: Last Checked */}
      <div className="flex items-center gap-2 ml-auto text-[9px] font-mono opacity-40" style={{ color: 'var(--muted-foreground)' }}>
        <span>REF_ID: {new Date().getTime().toString(16).slice(-6).toUpperCase()}</span>
      </div>
    </div>
  )

  return (
    <div className="relative flex flex-1 w-full flex-col items-center justify-center p-4 md:p-8 min-h-screen">
      {/* Floating panel with glass effect - Normalized Architecture */}
      <div
        className="relative w-full max-w-2xl rounded-2xl backdrop-blur-3xl backdrop-saturate-150 border shadow-2xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-cyan-500/10 group/panel h-[85vh]"
        style={{
          backgroundColor: 'var(--card-bg)',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent)',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        {/* Header (optional) */}
        {title && (
          <div className={`px-6 py-6 shrink-0 border-b transition-colors duration-500 ${hideTitleOnMobile ? 'hidden md:block' : ''}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-balance"
              style={{ color: 'var(--heading-primary)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-lg font-medium opacity-80" style={{ color: 'var(--muted-foreground)' }}>
                {subtitle}
              </p>
            )}
            {StatusIndicator}
          </div>
        )}

        {/* Scrollable content area - Force scroll effect even if empty */}
        <div className="flex-1 overflow-y-scroll px-5 py-6 premium-scrollbar scroll-smooth">
          <div className="min-h-[101%] flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
