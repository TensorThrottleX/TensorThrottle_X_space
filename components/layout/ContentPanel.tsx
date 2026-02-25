'use client'

import { ReactNode } from 'react'
import { StatusButton } from '@/components/ui/StatusButton'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

interface ContentPanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  latestPublishedAt?: string
  hideTitleOnMobile?: boolean
}

export function ContentPanel({ children, title, subtitle, latestPublishedAt, hideTitleOnMobile }: ContentPanelProps) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const StatusIndicator = <StatusButton latestPublishedAt={latestPublishedAt} align="end" />

  return (
    <div className="relative flex flex-1 w-full flex-col items-center justify-center p-4 md:p-8 min-h-screen">
      {/* Floating panel with glass effect - Normalized Architecture */}
      <div
        className={cn(
          "relative w-full max-w-[42rem] rounded-2xl backdrop-blur-3xl backdrop-saturate-150 border overflow-hidden flex flex-col transition-all duration-500 group/panel h-[85vh]",
          isBright
            ? "shadow-[var(--shadow-premium)] border-black/10"
            : "shadow-[var(--shadow-premium)] border-white/10"
        )}
        style={{
          backgroundColor: 'var(--card-bg)',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent)',
          borderColor: 'var(--card-border)',
        }}
      >
        {/* Header (optional) */}
        {title && (
          <div className={`px-6 py-6 shrink-0 border-b transition-colors duration-500 ${hideTitleOnMobile ? 'hidden md:block' : ''}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] animate-pulse" />
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-balance"
                    style={{ color: 'var(--heading-primary)' }}
                  >
                    {title}
                  </h1>
                </div>
                {subtitle && (
                  <p className="text-[10px] uppercase font-mono tracking-wider opacity-80" style={{ color: 'var(--muted-foreground)' }}>
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
