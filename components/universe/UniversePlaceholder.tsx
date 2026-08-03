'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface UniversePlaceholderProps {
  title: string
  description?: string
}

export function UniversePlaceholder({ title, description }: UniversePlaceholderProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--heading-primary)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mb-4 italic" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-6"
          style={{
            backgroundColor: 'rgba(251,146,60,0.15)',
            color: 'rgb(251,146,60)',
            border: '1px solid rgba(251,146,60,0.2)',
          }}
        >
          Coming Soon
        </div>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          No content available yet.
          <br />
          This world is currently under construction.
          <br />
          Check back soon.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'rgba(251,146,60,0.1)',
            color: 'rgb(251,146,60)',
            border: '1px solid rgba(251,146,60,0.15)',
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Return to Universe
        </button>
      </div>
    </div>
  )
}
