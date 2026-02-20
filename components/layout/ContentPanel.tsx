'use client'

import { ReactNode } from 'react'
import { StatusButton } from '@/components/ui/StatusButton'

interface ContentPanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  latestPublishedAt?: string
  hideTitleOnMobile?: boolean
}

export function ContentPanel({ children, title, subtitle, latestPublishedAt, hideTitleOnMobile }: ContentPanelProps) {
  const StatusIndicator = <StatusButton latestPublishedAt={latestPublishedAt} align="end" />

  return (
    <div className="relative flex flex-1 w-full flex-col items-center justify-center p-4 md:p-8 min-h-screen">
      {/* Floating panel with glass effect - Normalized Architecture */}
      <div
        className="relative w-full max-w-[42rem] rounded-2xl backdrop-blur-3xl backdrop-saturate-150 border shadow-2xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-cyan-500/10 group/panel h-[85vh]"
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-balance"
                  style={{ color: 'var(--heading-primary)' }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[10px] uppercase font-mono tracking-wider opacity-60" style={{ color: 'var(--muted-foreground)' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="hidden md:block">
                {StatusIndicator}
              </div>
            </div>
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
