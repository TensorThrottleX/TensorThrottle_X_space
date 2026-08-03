import React from 'react'
import { cn } from '@/lib/utils'

export interface PageMetric {
  icon: React.ReactNode
  label: string
  value: string | number
}

export interface PageStatus {
  label: string
  state: string
  color: string
}

interface PageHeaderProps {
  title: string
  description?: string
  accent?: string
  metrics?: PageMetric[]
  status?: PageStatus
  updatedAt?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, accent, metrics, status, updatedAt, children }: PageHeaderProps) {
  const accentColor = accent || 'rgb(251,146,60)'

  return (
    <section className="pt-28 px-4 md:px-10 w-full max-w-[90rem] mx-auto">
      <div className="max-w-[42rem]">
        <div
          className="w-8 h-0.5 rounded-full mb-4"
          style={{ backgroundColor: accentColor }}
        />

        <h1
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: 'var(--heading-primary)' }}
        >
          {title}
        </h1>

        {description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}

        {(metrics && metrics.length > 0) || status ? (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {metrics?.map((metric) => (
              <div
                key={metric.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <span className="shrink-0" style={{ color: accentColor }}>
                  {metric.icon}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                  {metric.value}
                </span>
                <span className="text-[10px] opacity-60 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                  {metric.label}
                </span>
              </div>
            ))}

            {status && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: `0 0 12px ${status.color}22`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: status.color,
                    boxShadow: `0 0 6px ${status.color}`,
                  }}
                />
                <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                  {status.label}
                </span>
              </div>
            )}

            {updatedAt && (
              <span className="text-[10px] opacity-40 ml-1" style={{ color: 'var(--muted-foreground)' }}>
                Updated {updatedAt}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </section>
  )
}
