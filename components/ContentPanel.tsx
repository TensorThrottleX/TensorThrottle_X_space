'use client'

import { ReactNode } from 'react'
import { differenceInWeeks, isValid } from 'date-fns'

interface ContentPanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  latestPublishedAt?: string
}

export function ContentPanel({ children, title, subtitle, latestPublishedAt }: ContentPanelProps) {
  // Calculate status color based on recency
  let StatusIndicator = null

  if (latestPublishedAt) {
    const pubDate = new Date(latestPublishedAt)
    // Only render if date is valid
    if (isValid(pubDate)) {
      const weeksDiff = differenceInWeeks(new Date(), pubDate)
      const isActive = weeksDiff < 3 // 2-3 weeks active window
      const colorClass = isActive ? 'bg-green-500' : 'bg-red-500';
      const textColorClass = isActive ? 'text-green-500' : 'text-red-500';

      StatusIndicator = (
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClass}`}></span>
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colorClass}`}></span>
          </div>
          <span className={`text-xs font-medium uppercase tracking-wider ${textColorClass}`}>
            {isActive ? 'Active' : 'Idle'}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8 h-screen w-full">
      {/* Floating panel with glass effect */}
      <div
        className="relative w-full max-w-xl h-[94vh] lg:-translate-x-20 rounded-3xl backdrop-blur-2xl backdrop-saturate-150 border shadow-2xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-cyan-500/5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        {/* Header (optional) */}
        {title && (
          <div className="px-8 py-8 shrink-0 border-b transition-colors duration-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-balance"
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

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 premium-scrollbar scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  )
}
